import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useGetStockAlarm } from '@/apis/queries/alarm';
import { Alarm } from '@/components/ui/alarm';
import { LoginContext } from '@/contexts/login';
import { cn } from '@/utils/cn';

interface NotificationPanelProps {
  className?: string;
}

export const NotificationPanel = ({ className }: NotificationPanelProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-md bg-white p-7 shadow',
        className,
      )}
    >
      <h2 className="display-bold20 text-center font-bold">알림</h2>
      <article className="flex flex-col gap-3 overflow-auto p-3">
        <NotificationContents />
      </article>
    </div>
  );
};

const NotificationContents = () => {
  const { stockId = '' } = useParams();
  const { isLoggedIn } = useContext(LoginContext);

  const { data } = useGetStockAlarm({ stockId, isLoggedIn });

  if (!isLoggedIn) {
    return <p className="text-center">로그인 후 이용 가능해요.</p>;
  }

  if (!data) {
    return <p className="text-center">알림 정보를 불러오는 데 실패했어요.</p>;
  }

  if (data.length === 0) {
    return <p className="text-center">현재 설정된 알림이 없어요.</p>;
  }

  return data.map((alarm) => (
    <Alarm
      key={alarm.alarmId}
      option={alarm.targetPrice ? '목표가' : '거래가'}
      goalPrice={alarm.targetPrice ?? alarm.targetVolume ?? 0}
      alarmDate={alarm.alarmExpiredDate}
    />
  ));
};
