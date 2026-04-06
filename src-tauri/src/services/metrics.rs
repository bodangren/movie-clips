use serde::Serialize;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

#[derive(Debug, Clone, Serialize)]
pub struct OperationMetrics {
    pub operation: String,
    pub duration_ms: u64,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VideoServiceMetrics {
    pub total_operations: u64,
    pub successful_operations: u64,
    pub failed_operations: u64,
    pub last_operations: Vec<OperationMetrics>,
    pub total_duration_ms: u64,
}

#[derive(Debug)]
pub struct MetricsCollector {
    total_operations: AtomicU64,
    successful_operations: AtomicU64,
    failed_operations: AtomicU64,
    total_duration_ms: AtomicU64,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self {
            total_operations: AtomicU64::new(0),
            successful_operations: AtomicU64::new(0),
            failed_operations: AtomicU64::new(0),
            total_duration_ms: AtomicU64::new(0),
        }
    }

    pub fn record_success(&self, operation: &str, duration_ms: u64) {
        self.total_operations.fetch_add(1, Ordering::Relaxed);
        self.successful_operations.fetch_add(1, Ordering::Relaxed);
        self.total_duration_ms
            .fetch_add(duration_ms, Ordering::Relaxed);
        tracing::info!(
            operation,
            duration_ms,
            "Video operation completed successfully"
        );
    }

    pub fn record_failure(&self, operation: &str, duration_ms: u64, error: &str) {
        self.total_operations.fetch_add(1, Ordering::Relaxed);
        self.failed_operations.fetch_add(1, Ordering::Relaxed);
        self.total_duration_ms
            .fetch_add(duration_ms, Ordering::Relaxed);
        tracing::error!(operation, duration_ms, error, "Video operation failed");
    }

    pub fn get_metrics(&self) -> VideoServiceMetrics {
        VideoServiceMetrics {
            total_operations: self.total_operations.load(Ordering::Relaxed),
            successful_operations: self.successful_operations.load(Ordering::Relaxed),
            failed_operations: self.failed_operations.load(Ordering::Relaxed),
            last_operations: Vec::new(),
            total_duration_ms: self.total_duration_ms.load(Ordering::Relaxed),
        }
    }
}

pub struct OperationTimer {
    operation: String,
    start: Instant,
}

impl OperationTimer {
    pub fn new(operation: &str) -> Self {
        tracing::debug!(operation, "Starting video operation");
        Self {
            operation: operation.to_string(),
            start: Instant::now(),
        }
    }

    pub fn success(self, collector: &MetricsCollector) {
        let duration_ms = self.start.elapsed().as_millis() as u64;
        collector.record_success(&self.operation, duration_ms);
    }

    pub fn failure(self, collector: &MetricsCollector, error: &str) {
        let duration_ms = self.start.elapsed().as_millis() as u64;
        collector.record_failure(&self.operation, duration_ms, error);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_collector_initial_state() {
        let collector = MetricsCollector::new();
        let metrics = collector.get_metrics();
        assert_eq!(metrics.total_operations, 0);
        assert_eq!(metrics.successful_operations, 0);
        assert_eq!(metrics.failed_operations, 0);
        assert_eq!(metrics.total_duration_ms, 0);
    }

    #[test]
    fn test_record_success() {
        let collector = MetricsCollector::new();
        collector.record_success("test_op", 100);
        let metrics = collector.get_metrics();
        assert_eq!(metrics.total_operations, 1);
        assert_eq!(metrics.successful_operations, 1);
        assert_eq!(metrics.failed_operations, 0);
        assert_eq!(metrics.total_duration_ms, 100);
    }

    #[test]
    fn test_record_failure() {
        let collector = MetricsCollector::new();
        collector.record_failure("test_op", 50, "error message");
        let metrics = collector.get_metrics();
        assert_eq!(metrics.total_operations, 1);
        assert_eq!(metrics.successful_operations, 0);
        assert_eq!(metrics.failed_operations, 1);
        assert_eq!(metrics.total_duration_ms, 50);
    }

    #[test]
    fn test_mixed_operations() {
        let collector = MetricsCollector::new();
        collector.record_success("op1", 100);
        collector.record_success("op2", 200);
        collector.record_failure("op3", 50, "error");
        let metrics = collector.get_metrics();
        assert_eq!(metrics.total_operations, 3);
        assert_eq!(metrics.successful_operations, 2);
        assert_eq!(metrics.failed_operations, 1);
        assert_eq!(metrics.total_duration_ms, 350);
    }

    #[test]
    fn test_operation_timer() {
        let collector = MetricsCollector::new();
        let timer = OperationTimer::new("test_timer");
        timer.success(&collector);
        let metrics = collector.get_metrics();
        assert_eq!(metrics.total_operations, 1);
        assert_eq!(metrics.successful_operations, 1);
    }
}
