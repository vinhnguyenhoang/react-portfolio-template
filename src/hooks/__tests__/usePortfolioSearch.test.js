import { renderHook, act } from '@testing-library/react'
import { usePortfolioSearch } from '../usePortfolioSearch'

const mockItems = [
    {
        locales: {
            title: 'RailsShop',
            tags: ['Rails', 'PostgreSQL', 'Stripe'],
            text: 'An e-commerce platform built with Stripe integration',
        },
    },
    {
        locales: {
            title: 'ChatAPI',
            tags: ['ActionCable', 'Redis'],
            text: 'Real-time WebSocket chat service',
        },
    },
    {
        locales: {
            title: 'TaskFlow',
            tags: ['React Native', 'Sidekiq'],
            text: 'Mobile task manager with background jobs',
        },
    },
]

describe('usePortfolioSearch', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    test('returns all items when search query is empty', () => {
        const { result } = renderHook(() => usePortfolioSearch(mockItems, null))
        expect(result.current.filteredItems).toHaveLength(mockItems.length)
        expect(result.current.searchQuery).toBe('')
    })

    test('filters items by title after 300ms debounce', () => {
        const { result } = renderHook(() => usePortfolioSearch(mockItems, null))

        act(() => { result.current.setSearchQuery('RailsShop') })
        act(() => { vi.advanceTimersByTime(300) })

        expect(result.current.filteredItems).toHaveLength(1)
        expect(result.current.filteredItems[0].locales.title).toBe('RailsShop')
    })

    test('returns empty array when no items match the query', () => {
        const { result } = renderHook(() => usePortfolioSearch(mockItems, null))

        act(() => { result.current.setSearchQuery('xyznotfound123') })
        act(() => { vi.advanceTimersByTime(300) })

        expect(result.current.filteredItems).toHaveLength(0)
    })

    test('handles items with null/undefined locales gracefully', () => {
        const itemsWithNulls = [
            { locales: { title: null, tags: null, text: null } },
            { locales: null },
            ...mockItems,
        ]
        const { result } = renderHook(() => usePortfolioSearch(itemsWithNulls, null))

        act(() => { result.current.setSearchQuery('RailsShop') })
        act(() => { vi.advanceTimersByTime(300) })

        // Only the mockItem with title 'RailsShop' should match — no crash from null locales
        expect(result.current.filteredItems).toHaveLength(1)
        expect(result.current.filteredItems[0].locales.title).toBe('RailsShop')
    })

    test('clearSearch resets query and returns all items', () => {
        const { result } = renderHook(() => usePortfolioSearch(mockItems, null))

        act(() => { result.current.setSearchQuery('RailsShop') })
        act(() => { vi.advanceTimersByTime(300) })
        expect(result.current.filteredItems).toHaveLength(1)

        act(() => { result.current.clearSearch() })
        act(() => { vi.advanceTimersByTime(300) })

        expect(result.current.searchQuery).toBe('')
        expect(result.current.filteredItems).toHaveLength(mockItems.length)
    })

    test('filters items by tag after 300ms debounce', () => {
        const { result } = renderHook(() => usePortfolioSearch(mockItems, null))

        act(() => { result.current.setSearchQuery('PostgreSQL') })
        act(() => { vi.advanceTimersByTime(300) })

        expect(result.current.filteredItems).toHaveLength(1)
        expect(result.current.filteredItems[0].locales.title).toBe('RailsShop')
    })
})
