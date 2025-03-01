import { useSuspenseQuery } from '@tanstack/react-query';
import { GetUserInfoSchema, type GetUserInfo } from './schema';
import { get } from '@/apis/utils/get';

const getUserInfo = () =>
  get<GetUserInfo>({
    schema: GetUserInfoSchema,
    url: '/api/user/info',
  });

export const useGetUserInfo = () => {
  return useSuspenseQuery({
    queryKey: ['userInfo'],
    queryFn: getUserInfo,
    staleTime: 1000 * 60 * 5,
  });
};
