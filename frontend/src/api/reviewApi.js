import axiosClient from './axiosClient'

export const fetchReviewsByFood = (foodId, params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.set('page', params.page)
  if (params.rating) queryParams.set('rating', params.rating)
  if (params.hasPhotos) queryParams.set('hasPhotos', 'true')
  if (params.sort) queryParams.set('sort', params.sort)
  const query = queryParams.toString()
  const url = `/reviews/food/${foodId}${query ? `?${query}` : ''}`
  return axiosClient.get(url).then((res) => res.data)
}

export const createReview = (data) => {
  return axiosClient.post('/reviews', data).then((res) => res.data)
}

export const addReaction = (reviewId, type) => {
  return axiosClient.post(`/reviews/${reviewId}/reaction`, { type }).then((res) => res.data)
}

export const uploadReviewPhotos = (files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('photos', file))
  return axiosClient.post('/reviews/upload-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data)
}

// Admin review management
export const fetchAllAdminReviews = (params = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.rating) query.set('rating', params.rating)
  if (params.hasPhotos) query.set('hasPhotos', params.hasPhotos)
  if (params.sort) query.set('sort', params.sort)
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  return axiosClient.get(`/admin/reviews?${query.toString()}`).then((res) => res.data)
}

export const replyToReview = (id, text) => {
  return axiosClient.post(`/admin/reviews/${id}/reply`, { text }).then((res) => res.data)
}

export const deleteReview = (id) => {
  return axiosClient.delete(`/admin/reviews/${id}`).then((res) => res.data)
}
