'use strict';

const {
  startReportWorker,
  setJobProcessing,
  setJobCompleted,
  setJobFailed,
  createQueue,
  closeQueue,
} = require('../queue/reportQueue');
const {
  generateReport,
  generateAccountingCsv,
  reportToCsv,
} = require('./reportService');
const logger = require('../utils/logger');
const { storeReportArtifact } = require('./reportArtifactStorage');

async function processReportJob(job) {
  const { jobId, schoolId, type, startDate, endDate, timezone, schemaVersion, className, classAt, format = 'json' } = job.data;
  const options = { schoolId, startDate, endDate, timezone, className, classAt };

  await setJobProcessing(jobId);
  logger.info('[ReportQueueService] Processing report job', { jobId, type, schoolId });

  try {
    let content;
    let actualSchemaVersion = schemaVersion;
    const isCsv = type === 'accounting_csv' || format === 'csv';
    if (type === 'accounting_csv') {
      const { csv, schemaVersion: version } = await generateAccountingCsv(options);
      content = csv;
      actualSchemaVersion = version;
    } else {
      const report = await generateReport(options);
      content = isCsv ? reportToCsv(report) : JSON.stringify(report);
    }

    const artifactKey = `reports/${schoolId}/${jobId}.${isCsv ? 'csv' : 'json'}`;
    await storeReportArtifact(artifactKey, content, isCsv ? 'text/csv' : 'application/json');
    await setJobCompleted(jobId, { artifactKey, schemaVersion: actualSchemaVersion });
    return { success: true, jobId, type };
  } catch (err) {
    await setJobFailed(jobId, err);
    throw err;
  }
}

let worker = null;

function startWorker() {
  if (worker) return worker;
  createQueue();
  worker = startReportWorker(processReportJob);
  if (worker) {
    logger.info('[ReportQueueService] Report worker started');
  }
  return worker;
}

async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await closeQueue();
}

module.exports = {
  startWorker,
  stopWorker,
};