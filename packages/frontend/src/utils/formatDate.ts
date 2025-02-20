import dayjs from 'dayjs';

export const formatDate = (isoString: string) => dayjs(isoString).format('YY.MM.DD HH:mm');

export const formatDateToYYYYMMDD = (isoString: string) => {
  return dayjs(isoString).format('YYYY.MM.DD');
};
