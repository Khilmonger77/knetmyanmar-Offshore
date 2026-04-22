import { getInternalUser, getUserFromSessionToken } from './usersStore.js'
import { sendOnlineBankingRestrictedForbidden } from './onlineBankingLockout.js'

export function getCustomerBearer(req) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

export function requireCustomer(req, res, next) {
  const token = getCustomerBearer(req)
  if (!token) {
    return res
      .status(401)
      .json({ ok: false, error: 'Sign in required.' })
  }
  const user = getUserFromSessionToken(token)
  if (!user) {
    return res
      .status(401)
      .json({ ok: false, error: 'Session expired. Sign in again.' })
  }
  req.customer = user
  req.customerToken = token
  const internal = getInternalUser(user.id)
  if (internal?.onlineBankingRestricted) {
    return sendOnlineBankingRestrictedForbidden(res, internal)
  }
  next()
}
