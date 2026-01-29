package jobs

// Processor is the interface that all job processors must implement
type Processor interface {
	Process(data []byte) error
}
