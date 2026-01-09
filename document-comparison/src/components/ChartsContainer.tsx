'use client';

import { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { Chart, ChartConfiguration } from 'chart.js/auto';

export default function ChartsContainer() {
  const { comparisonData } = useDocumentStore();
  const overviewChartRef = useRef<HTMLCanvasElement>(null);
  const fieldTypeChartRef = useRef<HTMLCanvasElement>(null);
  const overviewChartInstance = useRef<Chart | null>(null);
  const fieldTypeChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!comparisonData) return;

    const { stats } = comparisonData;

    // Overview Chart
    if (overviewChartRef.current) {
      if (overviewChartInstance.current) {
        overviewChartInstance.current.destroy();
      }

      const overviewConfig: ChartConfiguration = {
        type: 'pie',
        data: {
          labels: ['Matches', 'Differences', 'Not Present'],
          datasets: [{
            data: [stats.matches, stats.diffs, stats.missing],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
            borderColor: ['#fff', '#fff', '#fff'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: '"SF Mono", "Consolas", "Monaco", monospace',
                  size: 11
                },
                padding: 12,
                boxWidth: 12,
                boxHeight: 12
              }
            }
          }
        }
      };

      overviewChartInstance.current = new Chart(overviewChartRef.current, overviewConfig);
    }

    // Field Type Chart
    if (fieldTypeChartRef.current) {
      if (fieldTypeChartInstance.current) {
        fieldTypeChartInstance.current.destroy();
      }

      const headerCount = Object.keys(comparisonData.doc1Fields.headers).length;
      const tableCount = Object.keys(comparisonData.doc1Fields.tables).length;

      const fieldTypeConfig: ChartConfiguration = {
        type: 'pie',
        data: {
          labels: ['Header Fields', 'Table Fields'],
          datasets: [{
            data: [headerCount, tableCount],
            backgroundColor: ['#171717', '#737373'],
            borderColor: ['#fff', '#fff'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: '"SF Mono", "Consolas", "Monaco", monospace',
                  size: 11
                },
                padding: 12,
                boxWidth: 12,
                boxHeight: 12
              }
            }
          }
        }
      };

      fieldTypeChartInstance.current = new Chart(fieldTypeChartRef.current, fieldTypeConfig);
    }

    // Cleanup function
    return () => {
      if (overviewChartInstance.current) {
        overviewChartInstance.current.destroy();
      }
      if (fieldTypeChartInstance.current) {
        fieldTypeChartInstance.current.destroy();
      }
    };
  }, [comparisonData]);

  if (!comparisonData) return null;

  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <div className="chart-card">
          <h3 className="chart-title">
            <i data-lucide="pie-chart"></i>
            Comparison Overview
          </h3>
          <div className="chart-canvas-wrapper">
            <canvas ref={overviewChartRef} id="overview-chart"></canvas>
          </div>
        </div>
      </div>
      <div className="chart-wrapper">
        <div className="chart-card">
          <h3 className="chart-title">
            <i data-lucide="bar-chart-3"></i>
            Field Distribution
          </h3>
          <div className="chart-canvas-wrapper">
            <canvas ref={fieldTypeChartRef} id="field-type-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}