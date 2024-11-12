import type { ChartTheme } from '@/styles/theme';
import { createChart, type IChartApi } from 'lightweight-charts';
import { useEffect, useRef, RefObject } from 'react';
import priceData from '@/mocks/priceData.json';
import volumeData from '@/mocks/volumeData.json';
import {
  createCandlestickOptions,
  createChartOptions,
  createVolumeOptions,
} from '@/utils/createChartOptions';

interface UseChartProps {
  containerRef: RefObject<HTMLDivElement>;
  theme: ChartTheme;
}

export const useChart = ({ containerRef, theme }: UseChartProps) => {
  const chart = useRef<IChartApi>();

  useEffect(() => {
    if (!containerRef.current) return;

    chart.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      ...createChartOptions(theme),
    });

    const volumeSeries = chart.current.addHistogramSeries(
      createVolumeOptions(theme),
    );
    volumeSeries.setData(volumeData.data);

    const candleSeries = chart.current.addCandlestickSeries(
      createCandlestickOptions(theme),
    );
    candleSeries.setData(priceData.data);

    return () => {
      chart.current?.remove();
    };
  }, [containerRef, theme]);

  return chart;
};
