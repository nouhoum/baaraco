package consumer

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"

	"github.com/baaraco/baara/apps/worker/internal/jobs"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/redis"
)

type Consumer struct {
	queueName   string
	concurrency int
	processor   jobs.Processor
	stopCh      chan struct{}
	wg          sync.WaitGroup
}

func New(queueName string, concurrency int, processor jobs.Processor) *Consumer {
	return &Consumer{
		queueName:   queueName,
		concurrency: concurrency,
		processor:   processor,
		stopCh:      make(chan struct{}),
	}
}

func (c *Consumer) Start(ctx context.Context) {
	logger.Info("Starting consumer",
		zap.String("queue", c.queueName),
		zap.Int("concurrency", c.concurrency),
	)

	for i := 0; i < c.concurrency; i++ {
		c.wg.Add(1)
		go c.worker(ctx, i)
	}
}

func (c *Consumer) Stop() {
	logger.Info("Stopping consumer",
		zap.String("queue", c.queueName),
	)
	close(c.stopCh)
	c.wg.Wait()
	logger.Info("Consumer stopped",
		zap.String("queue", c.queueName),
	)
}

func (c *Consumer) worker(ctx context.Context, id int) {
	defer c.wg.Done()

	logger.Debug("Worker started",
		zap.String("queue", c.queueName),
		zap.Int("worker_id", id),
	)

	for {
		select {
		case <-c.stopCh:
			logger.Debug("Worker stopping",
				zap.String("queue", c.queueName),
				zap.Int("worker_id", id),
			)
			return
		case <-ctx.Done():
			logger.Debug("Worker context canceled",
				zap.String("queue", c.queueName),
				zap.Int("worker_id", id),
			)
			return
		default:
			c.processNext(ctx, id)
		}
	}
}

func (c *Consumer) processNext(ctx context.Context, workerID int) {
	// Use a timeout for blocking pop
	popCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	data, err := redis.Pop(popCtx, c.queueName, 5*time.Second)
	if err != nil {
		// Timeout is expected, not an error
		if err == context.DeadlineExceeded || err.Error() == "redis: nil" {
			return
		}
		logger.Error("Failed to pop from queue",
			zap.String("queue", c.queueName),
			zap.Int("worker_id", workerID),
			zap.Error(err),
		)
		time.Sleep(time.Second) // Back off on error
		return
	}

	if data == nil {
		return
	}

	logger.Debug("Processing job",
		zap.String("queue", c.queueName),
		zap.Int("worker_id", workerID),
	)

	start := time.Now()
	if err := c.processor.Process(data); err != nil {
		logger.Error("Failed to process job",
			zap.String("queue", c.queueName),
			zap.Int("worker_id", workerID),
			zap.Error(err),
			zap.Duration("duration", time.Since(start)),
		)
		// TODO: implement retry logic / dead letter queue
	} else {
		logger.Debug("Job processed successfully",
			zap.String("queue", c.queueName),
			zap.Int("worker_id", workerID),
			zap.Duration("duration", time.Since(start)),
		)
	}
}
