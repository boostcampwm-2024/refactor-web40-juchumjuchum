import axios, { AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { instance } from '../config';
import { formatZodError } from './formatZodError';

interface GetParams {
  params?: AxiosRequestConfig['params'];
  schema: z.ZodType;
  url: string;
}

export const get = async <T>({
                               params,
                               schema,
                               url,
                             }: GetParams): Promise<T> => {
  try {
    const { data } = await instance.get(url, { params });
    const result = schema.safeParse(data);

    if (!result.success) {
      console.log(`${url} : Validation Error`, {
        errors: result.error.errors,
        receivedData: data,
        params
      });
      throw new Error(formatZodError(result.error));
    }

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {  // instance 대신 axios 사용
      if (error.response?.status === 404) {
        throw new Error('NOT_FOUND');
      }
    }
    throw error;
  }
};