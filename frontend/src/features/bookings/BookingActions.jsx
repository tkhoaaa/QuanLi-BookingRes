import Button from '../ui/Button'
import { ORDER_STATUS } from '../../constants'

export default function BookingActions({
  order,
  onStatusUpdate,
  onAssignShipper,
  onAccept,
  onComplete,
  onCancel,
  loading,
}) {
  const isAdmin = order?.role === 'admin'
  const isShipper = order?.shipperId

  return (
    <div className="flex flex-wrap gap-2">
      {order?.status === ORDER_STATUS.PENDING && (
        <>
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onStatusUpdate(ORDER_STATUS.CONFIRMED)}
                loading={loading}
              >
                Xac nhan don
              </Button>
              {onAssignShipper && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onAssignShipper}
                  loading={loading}
                >
                  Gan shipper
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={onCancel}
                loading={loading}
              >
                Huy don
              </Button>
            </>
          )}
        </>
      )}

      {order?.status === ORDER_STATUS.CONFIRMED && isAdmin && (
        <>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onStatusUpdate(ORDER_STATUS.PREPARING)}
            loading={loading}
          >
            Bat dau chuan bi
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onCancel}
            loading={loading}
          >
            Huy don
          </Button>
        </>
      )}

      {order?.status === ORDER_STATUS.PREPARING && isAdmin && (
        <Button
          size="sm"
          variant="primary"
          onClick={() => onStatusUpdate(ORDER_STATUS.READY)}
          loading={loading}
        >
          Da san sang
        </Button>
      )}

      {order?.status === ORDER_STATUS.READY && !isShipper && isAdmin && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAssignShipper}
          loading={loading}
        >
          Gan shipper
        </Button>
      )}

      {order?.status === ORDER_STATUS.READY && isShipper && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAccept}
          loading={loading}
        >
          Nhan giao hang
        </Button>
      )}

      {order?.status === ORDER_STATUS.SHIPPING && isShipper && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onComplete}
          loading={loading}
        >
          Da giao hang
        </Button>
      )}
    </div>
  )
}
