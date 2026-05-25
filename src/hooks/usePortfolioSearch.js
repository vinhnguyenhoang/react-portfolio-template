/**
 * @author Nguyễn Hoàng Vinh
 * @date 2026-05-25
 * @description Custom hook for portfolio live search with debounce.
 */
import { useState, useEffect } from 'react'

/**
 * Filters portfolio items by a text query with 300ms debounce.
 * Resets the search query whenever the selected category changes.
 *
 * @param {ArticleItemDataWrapper[]} items - Items already filtered by category
 * @param {string|null} selectedCategoryId - Currently selected category (triggers search reset)
 * @returns {{ filteredItems: ArticleItemDataWrapper[], searchQuery: string, setSearchQuery: Function, clearSearch: Function }}
 */
export const usePortfolioSearch = (items, selectedCategoryId) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    // Reset search (and debounced value) immediately when category changes
    useEffect(() => {
        setSearchQuery('')
        setDebouncedQuery('')
    }, [selectedCategoryId])

    // Debounce: update debouncedQuery 300ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const filteredItems = debouncedQuery
        ? items.filter(item => {
            const q = debouncedQuery.toLowerCase()
            const title = (item.locales?.title || '').toLowerCase()
            // Strip HTML tags from text before matching (text uses dangerouslySetInnerHTML)
            const text  = (item.locales?.text  || '').replace(/<[^>]*>/g, '').toLowerCase()
            const tags  = (item.locales?.tags  || []).join(' ').toLowerCase()
            return title.includes(q) || text.includes(q) || tags.includes(q)
          })
        : items

    const clearSearch = () => setSearchQuery('')

    return { filteredItems, searchQuery, debouncedQuery, setSearchQuery, clearSearch }
}
