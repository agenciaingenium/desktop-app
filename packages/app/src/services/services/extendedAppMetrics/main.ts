import { app, webContents } from 'electron';
import { RPC } from '../../lib/types';
import { ExtendedAppMetricsService } from './interface';

export class ExtendedAppMetricsServiceImpl extends ExtendedAppMetricsService implements RPC.Interface<ExtendedAppMetricsService> {

  async getNumberOfWebContents() {
    await app.whenReady();
    return webContents.getAllWebContents().length;
  }

  async getAppMetricsSummary() {
    await app.whenReady();
    const appMetrics = app.getAppMetrics();

    const appMetricsMemoryKB = appMetrics.map(m => m.memory.workingSetSize);

    const systemMemoryInfo = process.getSystemMemoryInfo();

    return {
      freeMemoryMB: (systemMemoryInfo.free / 1024),
      processCount: appMetrics.length,
      processMemorySumMB: appMetricsMemoryKB.reduce((a, b) => a + b, 0) / 1024,
      processMemoryMaxMB: Math.max(...appMetricsMemoryKB) / 1024,
      processMemoryMinMB: Math.min(...appMetricsMemoryKB) / 1024,
      processMemoryAvgMB: appMetricsMemoryKB.reduce((a, b) => a + b, 0) / appMetricsMemoryKB.length / 1024,
    };
  }
}