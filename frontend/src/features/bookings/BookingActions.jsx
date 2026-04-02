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
  const isShipper = !!order?.shipper?._id

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
                Xác nhận đơn
              </Button>
              {onAssignShipper && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onAssignShipper}
                  loading={loading}
                >
                  Gán shipper
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={onCancel}
                loading={loading}
              >
                Hủy đơn
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
            Bắt đầu chuẩn bị
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onCancel}
            loading={loading}
          >
            Hủy đơn
          </Button>
        </>
      )}

      {order?.status === ORDER_STATUS.PREPARING && isAdmin && (
        <Button
          size="sm"
          variant="primary"
          onClick={() => onStatusUpdate(ORDER_STATUS.PICKING)}
          loading={loading}
        >
          Đã sẵn sàng
        </Button>
      )}

      {order?.status === ORDER_STATUS.PICKING && !isShipper && isAdmin && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAssignShipper}
          loading={loading}
        >
          Gán shipper
        </Button>
      )}

      {order?.status === ORDER_STATUS.PICKING && isShipper && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAccept}
          loading={loading}
        >
          Nhận giao hàng
        </Button>
      )}

      {order?.status === ORDER_STATUS.DELIVERING && isShipper && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onComplete}
          loading={loading}
        >
          Đã giao hàng
        </Button>
      )}
    </div>
  )
}
