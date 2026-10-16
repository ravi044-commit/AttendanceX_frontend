import { useState, useEffect, useRef, useCallback } from 'react';

// Global in-memory cache for fast page transitions and zero-flicker re-renders
const queryCache = new Map();

/**
 * useInfiniteList
 * High-performance infinite scrolling hook with IntersectionObserver (rootMargin: 200px),
 * 400ms search debounce, background prefetching, request cancellation, and client caching.
 *
 * @param {Function|string} fetcher - Function (params) => Promise<{ items, total, hasMore }> or array
 * @param {Object} params - Query parameters (search, filter, department, etc.)
 * @param {Object} options - Configuration options (limit, debounceMs, cacheTtl)
 */
export const useInfiniteList = (fetcher, params = {}, options = {}) => {
  const {
    limit = 20,
    debounceMs = 400,
    cacheTtlMs = 300000, // 5 minutes
    enabled = true,
  } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Debounced params tracking
  const [debouncedParams, setDebouncedParams] = useState(params);
  const prevParamsRef = useRef(params);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const prefetchControllerRef = useRef(null);

  // 400ms debounce on search inputs and filter changes
  useEffect(() => {
    const isSame = JSON.stringify(prevParamsRef.current) === JSON.stringify(params);
    if (isSame) return;
    prevParamsRef.current = params;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedParams(params);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [params, debounceMs]);

  const serializeCacheKey = (p, pNum) => {
    const keyParams = { ...p, page: pNum, limit };
    return `inf_${JSON.stringify(keyParams)}`;
  };

  // Perform fetch for a specific page
  const executeFetch = useCallback(
    async (targetPage, isInitial = false) => {
      if (!enabled || typeof fetcher !== 'function') return;

      const cacheKey = serializeCacheKey(debouncedParams, targetPage);
      const cached = queryCache.get(cacheKey);

      // Instant stale-while-revalidate from cache if valid
      if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
        if (targetPage === 1) {
          setItems(cached.items);
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id || i.uid || JSON.stringify(i)));
            const newUnique = cached.items.filter((i) => !existingIds.has(i.id || i.uid || JSON.stringify(i)));
            return [...prev, ...newUnique];
          });
        }
        setTotal(cached.total);
        setHasMore(cached.hasMore);
        setPage(targetPage);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const fetchParams = {
          ...debouncedParams,
          page: targetPage,
          limit,
          signal: abortControllerRef.current.signal,
        };

        const res = await fetcher(fetchParams);

        if (!isMountedRef.current) return;

        let newItems = [];
        let fetchedTotal = 0;
        let moreAvailable = false;

        if (Array.isArray(res)) {
          newItems = res;
          fetchedTotal = res.length;
          moreAvailable = res.length === limit;
        } else if (res && typeof res === 'object') {
          newItems = Array.isArray(res.items) ? res.items : [];
          fetchedTotal = typeof res.total === 'number' ? res.total : newItems.length;
          moreAvailable = typeof res.hasMore === 'boolean'
            ? res.hasMore
            : (targetPage * limit) < fetchedTotal;
        }

        // Cache result
        queryCache.set(cacheKey, {
          items: newItems,
          total: fetchedTotal,
          hasMore: moreAvailable,
          timestamp: Date.now(),
        });

        if (targetPage === 1) {
          setItems(newItems);
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id || i.uid || JSON.stringify(i)));
            const newUnique = newItems.filter((i) => !existingIds.has(i.id || i.uid || JSON.stringify(i)));
            return [...prev, ...newUnique];
          });
        }

        setPage(targetPage);
        setTotal(fetchedTotal);
        setHasMore(moreAvailable);

        // Background prefetch next page if available
        if (moreAvailable) {
          const nextKey = serializeCacheKey(debouncedParams, targetPage + 1);
          if (!queryCache.has(nextKey)) {
            setTimeout(async () => {
              try {
                const nextRes = await fetcher({
                  ...debouncedParams,
                  page: targetPage + 1,
                  limit,
                });
                if (nextRes && isMountedRef.current) {
                  const nextItems = Array.isArray(nextRes) ? nextRes : (nextRes.items || []);
                  const nextTotal = typeof nextRes.total === 'number' ? nextRes.total : fetchedTotal;
                  const nextMore = typeof nextRes.hasMore === 'boolean'
                    ? nextRes.hasMore
                    : ((targetPage + 1) * limit) < nextTotal;
                  queryCache.set(nextKey, {
                    items: nextItems,
                    total: nextTotal,
                    hasMore: nextMore,
                    timestamp: Date.now(),
                  });
                }
              } catch {
                // Background prefetch fail silently
              }
            }, 300);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMountedRef.current) {
          console.error('Infinite list fetch error:', err);
          setError(err.message || 'Failed to load records');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetcher, debouncedParams, limit, cacheTtlMs, enabled]
  );

  // Trigger initial fetch or reset when debounced parameters change
  useEffect(() => {
    isMountedRef.current = true;
    setPage(1);
    executeFetch(1, true);

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [debouncedParams, executeFetch]);

  // Load next page
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    executeFetch(page + 1, false);
  }, [loading, loadingMore, hasMore, page, executeFetch]);

  // Explicit refresh/refetch
  const refetch = useCallback(() => {
    // Clear cache entries for current params
    for (const key of queryCache.keys()) {
      if (key.includes(JSON.stringify(debouncedParams))) {
        queryCache.delete(key);
      }
    }
    setPage(1);
    executeFetch(1, true);
  }, [debouncedParams, executeFetch]);

  // Sentinel IntersectionObserver ref callback (rootMargin: 200px)
  const sentinelObserverRef = useRef(null);
  const sentinelRef = useCallback(
    (node) => {
      if (sentinelObserverRef.current) {
        sentinelObserverRef.current.disconnect();
      }

      if (node && hasMore && !loading && !loadingMore) {
        sentinelObserverRef.current = new IntersectionObserver(
          (entries) => {
            const first = entries[0];
            if (first && first.isIntersecting) {
              loadMore();
            }
          },
          {
            root: null,
            rootMargin: '200px',
            threshold: 0.05,
          }
        );
        sentinelObserverRef.current.observe(node);
      }
    },
    [hasMore, loading, loadingMore, loadMore]
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sentinelObserverRef.current) sentinelObserverRef.current.disconnect();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    items,
    page,
    total,
    hasMore,
    loading,
    loadingMore,
    isInitialLoading: loading && page === 1 && items.length === 0,
    isLoadingMore: loadingMore,
    error,
    loadMore,
    refetch,
    sentinelRef,
  };
};
