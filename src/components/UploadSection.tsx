'use client';

import { useState, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { PackageData } from '@/types/document';

interface UploadCardProps {
  packageNum: 1 | 2;
  title: string;
}

function UploadCard({ packageNum, title }: UploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    packageID: string;
    packageName: string;
    totalFiles: number;
    status: string;
  } | null>(null);
  
  const { setPackageData } = useDocumentStore();

  useEffect(() => {
    // Initialize Lucide icons for this component
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const data: PackageData = JSON.parse(text);
      
      // Store the package data
      setPackageData(packageNum, data);
      
      // Display file info
      const batch = data.batch[0];
      setFileInfo({
        packageID: batch.packageID,
        packageName: batch.packageName,
        totalFiles: batch.totalFiles,
        status: batch.packageStatus
      });
    } catch (error) {
      alert(`Error parsing JSON file: ${(error as Error).message}`);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type === 'application/json') {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="upload-card">
      <div className="upload-card-header">
        <span className="upload-number">0{packageNum}</span>
        <h3>{title}</h3>
      </div>
      
      <div className="upload-area">
        <input
          type="file"
          accept=".json"
          onChange={handleInputChange}
          className="file-input"
          id={`file${packageNum}`}
        />
        <label
          htmlFor={`file${packageNum}`}
          className="file-label"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <i data-lucide="file-json-2"></i>
          <span className="file-label-text">Choose JSON File</span>
          <span className="file-label-hint">or drag and drop</span>
        </label>
      </div>
      
      {fileInfo && (
        <div className="file-info active">
          <strong>Package ID:</strong> {fileInfo.packageID}<br />
          <strong>Package Name:</strong> {fileInfo.packageName}<br />
          <strong>Total Files:</strong> {fileInfo.totalFiles}<br />
          <strong>Status:</strong> {fileInfo.status}
        </div>
      )}
    </div>
  );
}

export default function UploadSection() {
  return (
    <section className="upload-section">
      <div className="section-title">
        <i data-lucide="upload-cloud"></i>
        <h2>Upload Documents</h2>
      </div>
      
      <div className="upload-container">
        <UploadCard packageNum={1} title="First Package" />
        <UploadCard packageNum={2} title="Second Package" />
      </div>
    </section>
  );
}