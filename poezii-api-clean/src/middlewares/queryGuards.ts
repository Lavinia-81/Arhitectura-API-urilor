// middleware/queryGuard.ts
export function guardQuery(filters: any) {
  // Limitează paginarea (maxim 100)
  if (filters.limit > 100) {
    throw new Error('Limit cannot exceed 100')
  }
  
  // Permite doar sortări indexate
  const allowedSorts = ['title', 'year', 'popularity', '-title', '-year', '-popularity']
  if (filters.sortBy && !allowedSorts.includes(filters.sortBy)) {
    throw new Error(`Sort field ${filters.sortBy} is not allowed`)
  }
}