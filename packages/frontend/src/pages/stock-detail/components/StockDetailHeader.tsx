import { useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteStockUser,
  usePostStockUser,
} from '@/apis/queries/stock-detail';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { UserStatus } from '@/constants/chatStatus';
import { modalMessage, ModalMessage } from '@/constants/modalMessage';
import { LoginContext } from '@/contexts/login';
import { NewsButton } from './NewsButton';
import { NewsSummary } from '@/components/NewsSummary';

interface StockDetailHeaderProps {
  stockId: string;
  stockName: string;
  isOwnerStock: boolean;
}

export const StockDetailHeader = ({
  stockId,
  stockName,
  isOwnerStock,
}: StockDetailHeaderProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(LoginContext);

  const [showModal, setShowModal] = useState(false);
  const [userStatus, setUserStatus] = useState<ModalMessage>(
    UserStatus.NOT_AUTHENTICATED,
  );
  const [latestNews, setLatestNews] = useState<{
    positive_content_summary: string | null;
    negative_content_summary: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setUserStatus(UserStatus.NOT_AUTHENTICATED);
      return;
    }

    setUserStatus(() => {
      return isOwnerStock ? UserStatus.OWNERSHIP : UserStatus.NOT_OWNERSHIP;
    });
  }, [isOwnerStock, isLoggedIn]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/stock/news/${stockId}`);
        const data = await response.json();
        if (data.length > 0) {
          setLatestNews({
            positive_content_summary: data[0].positiveContentSummary === '해당사항 없음' ? null : data[0].positiveContentSummary,
            negative_content_summary: data[0].negativeContentSummary === '해당사항 없음' ? null : data[0].negativeContentSummary,
          });
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    };
    
    fetchNews();
  }, [stockId]);

  const { mutate: postStockUser } = usePostStockUser({
    onSuccess: () => {
      setUserStatus(UserStatus.OWNERSHIP);
      queryClient.invalidateQueries({ queryKey: ['userStock'] });
      queryClient.invalidateQueries({ queryKey: ['loginStatus'] });
      queryClient.invalidateQueries({ queryKey: ['stockOwnership', stockId] });
    },
  });

  const { mutate: deleteStockUser } = useDeleteStockUser({
    onSuccess: () => {
      setUserStatus(UserStatus.NOT_OWNERSHIP);
      queryClient.invalidateQueries({ queryKey: ['userStock'] });
      queryClient.invalidateQueries({ queryKey: ['loginStatus'] });
      queryClient.invalidateQueries({ queryKey: ['stockOwnership', stockId] });
    },
  });

  const handleModalConfirm = {
    NOT_OWNERSHIP: () => postStockUser({ stockId }),
    OWNERSHIP: () => deleteStockUser({ stockId }),
    NOT_AUTHENTICATED: () => navigate('/login'),
  };

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h1 className="display-bold24">{stockName}</h1>
        {latestNews && <NewsButton stockId={stockId} stockName={stockName} />}
        <Button
          className="flex items-center justify-center gap-1"
          onClick={() => {
            setShowModal(true);
          }}
        >
          {modalMessage[userStatus].label}
        </Button>
      </div>
      {latestNews && <NewsSummary {...latestNews} />}
      {showModal &&
        createPortal(
          <Modal
            title="주식 소유"
            onClose={() => setShowModal(false)}
            onConfirm={() => {
              handleModalConfirm[userStatus]();
              setShowModal(false);
            }}
          >
            {modalMessage[userStatus].message}
          </Modal>,
          document.body,
        )}
    </header>
  );
};
