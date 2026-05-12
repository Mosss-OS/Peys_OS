package peys

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	BaseURL    = "https://api.peys.app"
	APIVersion = "v1"
)

// Client is the main Peys API client
type Client struct {
	APIKey  string
	BaseURL string
	Network string
	Timeout time.Duration
	client  *http.Client
}

// Config holds client configuration
type Config struct {
	APIKey  string
	BaseURL string
	Network string
	Timeout time.Duration
}

// Payment represents a payment object
type Payment struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Amount    string `json:"amount"`
	Currency  string `json:"currency"`
	Recipient string `json:"recipient"`
	TxHash    string `json:"txHash,omitempty"`
	CreatedAt string `json:"createdAt"`
	ClaimLink string `json:"claimLink,omitempty"`
}

// PaymentLink represents a payment link
type PaymentLink struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	ShortURL    string  `json:"shortUrl"`
}

// FiatWithdrawal represents a fiat withdrawal
type FiatWithdrawal struct {
	ID               string `json:"id"`
	Status           string `json:"status"`
	EstimatedArrival string `json:"estimatedArrival"`
}

// BillsPayment represents a bill payment
type BillsPayment struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Reference string `json:"reference"`
}

// P2PListing represents a P2P marketplace listing
type P2PListing struct {
	ID             string   `json:"id"`
	Type           string   `json:"type"`
	FiatCurrency   string   `json:"fiatCurrency"`
	FiatAmount     float64  `json:"fiatAmount"`
	CryptoAmount   string   `json:"cryptoAmount"`
	CryptoCurrency string   `json:"cryptoCurrency"`
	PaymentMethods []string `json:"paymentMethods"`
	Status         string   `json:"status"`
}

// P2PTrade represents a P2P trade
type P2PTrade struct {
	ID         string  `json:"id"`
	ListingID  string  `json:"listingId"`
	FiatAmount float64 `json:"fiatAmount"`
	Status     string  `json:"status"`
}

// Webhook represents a webhook registration
type Webhook struct {
	ID     string   `json:"id"`
	URL    string   `json:"url"`
	Events []string `json:"events"`
	Secret string   `json:"secret"`
}

// APIResponse is the standard API response wrapper
type APIResponse struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data,omitempty"`
	Error  string      `json:"error,omitempty"`
}

// NewClient creates a new Peys API client
func NewClient(apiKey string, configs ...Config) (*Client, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	cfg := Config{
		BaseURL: BaseURL,
		Network: "base-sepolia",
		Timeout: 30 * time.Second,
	}

	if len(configs) > 0 {
		cfg = configs[0]
		if cfg.BaseURL == "" {
			cfg.BaseURL = BaseURL
		}
		if cfg.Timeout == 0 {
			cfg.Timeout = 30 * time.Second
		}
	}

	return &Client{
		APIKey:  apiKey,
		BaseURL: cfg.BaseURL,
		Network: cfg.Network,
		Timeout: cfg.Timeout,
		client: &http.Client{
			Timeout: cfg.Timeout,
		},
	}, nil
}

func (c *Client) doRequest(method, endpoint string, body interface{}) (*APIResponse, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, c.BaseURL+endpoint, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.APIKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var apiResp APIResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if apiResp.Status == "error" {
		return nil, fmt.Errorf("API error: %s", apiResp.Error)
	}

	return &apiResp, nil
}

func (c *Client) generateCommitHash() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	hash := sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:])
}

// Payments returns the payments API
func (c *Client) Payments() *PaymentsAPI {
	return &PaymentsAPI{client: c}
}

// Links returns the payment links API
func (c *Client) Links() *LinksAPI {
	return &LinksAPI{client: c}
}

// Fiat returns the fiat operations API
func (c *Client) Fiat() *FiatAPI {
	return &FiatAPI{client: c}
}

// P2P returns the P2P marketplace API
func (c *Client) P2P() *P2PAPI {
	return &P2PAPI{client: c}
}

// Webhooks returns the webhooks API
func (c *Client) Webhooks() *WebhooksAPI {
	return &WebhooksAPI{client: c}
}

// PaymentsAPI handles payment operations
type PaymentsAPI struct {
	client *Client
}

// CreatePaymentInput is the input for creating a payment
type CreatePaymentInput struct {
	Amount    string
	Currency  string
	Recipient string
	Metadata  map[string]interface{}
}

// Create creates a new payment
func (p *PaymentsAPI) Create(input CreatePaymentInput) (*Payment, error) {
	data := map[string]interface{}{
		"amount":           input.Amount,
		"currency":         input.Currency,
		"recipientAddress": input.Recipient,
		"network":          p.client.Network,
		"commitHash":       p.client.generateCommitHash(),
	}

	if input.Metadata != nil {
		for k, v := range input.Metadata {
			data[k] = v
		}
	}

	resp, err := p.client.doRequest("POST", "/api/v1/payments/initiate", data)
	if err != nil {
		return nil, err
	}

	payment := &Payment{}
	if err := mapToStruct(resp.Data, payment); err != nil {
		return nil, err
	}

	payment.ClaimLink = fmt.Sprintf("%s/claim/%s", p.client.BaseURL, payment.ID)
	return payment, nil
}

// Get retrieves a payment by ID
func (p *PaymentsAPI) Get(paymentID string) (*Payment, error) {
	resp, err := p.client.doRequest("GET", fmt.Sprintf("/api/v1/payments/%s", paymentID), nil)
	if err != nil {
		return nil, err
	}

	payment := &Payment{}
	if err := mapToStruct(resp.Data, payment); err != nil {
		return nil, err
	}

	return payment, nil
}

// Confirm confirms a payment with the reveal secret
func (p *PaymentsAPI) Confirm(paymentID, secret string) (*Payment, error) {
	data := map[string]interface{}{
		"paymentId":    paymentID,
		"revealSecret": secret,
	}

	resp, err := p.client.doRequest("POST", "/api/v1/payments/confirm", data)
	if err != nil {
		return nil, err
	}

	payment := &Payment{}
	if err := mapToStruct(resp.Data, payment); err != nil {
		return nil, err
	}

	return payment, nil
}

// Refund refunds a payment
func (p *PaymentsAPI) Refund(paymentID string, reason string) (*Payment, error) {
	data := map[string]interface{}{
		"paymentId": paymentID,
	}
	if reason != "" {
		data["reason"] = reason
	}

	resp, err := p.client.doRequest("POST", "/api/v1/payments/refund", data)
	if err != nil {
		return nil, err
	}

	payment := &Payment{}
	if err := mapToStruct(resp.Data, payment); err != nil {
		return nil, err
	}

	return payment, nil
}

// ListPaymentsInput is the input for listing payments
type ListPaymentsInput struct {
	Page   int
	Limit  int
	Status string
}

// List lists payments with pagination
func (p *PaymentsAPI) List(input ListPaymentsInput) ([]Payment, int, error) {
	params := url.Values{}
	if input.Page > 0 {
		params.Set("page", strconv.Itoa(input.Page))
	}
	if input.Limit > 0 {
		params.Set("limit", strconv.Itoa(input.Limit))
	}
	if input.Status != "" {
		params.Set("status", input.Status)
	}

	resp, err := p.client.doRequest("GET", "/api/v1/transactions?"+params.Encode(), nil)
	if err != nil {
		return nil, 0, err
	}

	data, ok := resp.Data.(map[string]interface{})
	if !ok {
		return nil, 0, fmt.Errorf("invalid response format")
	}

	items, ok := data["items"].([]interface{})
	if !ok {
		return nil, 0, fmt.Errorf("invalid items format")
	}

	payments := make([]Payment, 0, len(items))
	for _, item := range items {
		payment := Payment{}
		if err := mapToStruct(item, &payment); err != nil {
			continue
		}
		payments = append(payments, payment)
	}

	total, _ := data["total"].(float64)
	return payments, int(total), nil
}

// LinksAPI handles payment link operations
type LinksAPI struct {
	client *Client
}

// CreateLinkInput is the input for creating a payment link
type CreateLinkInput struct {
	Title            string
	Description      string
	Amount           float64
	Currency         string
	RecipientAddress string
	ExpiresAt        string
}

// Create creates a new payment link
func (l *LinksAPI) Create(input CreateLinkInput) (*PaymentLink, error) {
	data := map[string]interface{}{
		"title":            input.Title,
		"amount":           input.Amount,
		"currency":         input.Currency,
		"recipientAddress": input.RecipientAddress,
		"network":          l.client.Network,
	}

	if input.Description != "" {
		data["description"] = input.Description
	}
	if input.ExpiresAt != "" {
		data["expiresAt"] = input.ExpiresAt
	}

	resp, err := l.client.doRequest("POST", "/api/v1/payments/links", data)
	if err != nil {
		return nil, err
	}

	link := &PaymentLink{}
	if err := mapToStruct(resp.Data, link); err != nil {
		return nil, err
	}

	return link, nil
}

// Get retrieves a payment link by ID
func (l *LinksAPI) Get(linkID string) (*PaymentLink, error) {
	resp, err := l.client.doRequest("GET", fmt.Sprintf("/api/v1/payments/links/%s", linkID), nil)
	if err != nil {
		return nil, err
	}

	link := &PaymentLink{}
	if err := mapToStruct(resp.Data, link); err != nil {
		return nil, err
	}

	return link, nil
}

// FiatAPI handles fiat operations
type FiatAPI struct {
	client *Client
}

// WithdrawInput is the input for fiat withdrawal
type WithdrawInput struct {
	Amount        float64
	Currency      string
	BankCode      string
	AccountNumber string
	AccountName   string
	Narration     string
}

// Withdraw withdraws to African bank accounts
func (f *FiatAPI) Withdraw(input WithdrawInput) (*FiatWithdrawal, error) {
	data := map[string]interface{}{
		"amount":        input.Amount,
		"currency":      input.Currency,
		"bankCode":      input.BankCode,
		"accountNumber": input.AccountNumber,
		"accountName":   input.AccountName,
	}

	if input.Narration != "" {
		data["narration"] = input.Narration
	}

	resp, err := f.client.doRequest("POST", "/api/v1/fiat/withdraw", data)
	if err != nil {
		return nil, err
	}

	result := &FiatWithdrawal{}
	if err := mapToStruct(resp.Data, result); err != nil {
		return nil, err
	}

	return result, nil
}

// PayBillInput is the input for paying bills
type PayBillInput struct {
	Type     string
	Provider string
	Amount   float64
	Phone    string
}

// PayBill pays bills (airtime, data, TV, electricity)
func (f *FiatAPI) PayBill(input PayBillInput) (*BillsPayment, error) {
	data := map[string]interface{}{
		"type":     input.Type,
		"provider": input.Provider,
		"amount":   input.Amount,
	}

	if input.Phone != "" {
		data["phone"] = input.Phone
	}

	resp, err := f.client.doRequest("POST", "/api/v1/fiat/bills", data)
	if err != nil {
		return nil, err
	}

	result := &BillsPayment{}
	if err := mapToStruct(resp.Data, result); err != nil {
		return nil, err
	}

	return result, nil
}

// P2PAPI handles P2P marketplace operations
type P2PAPI struct {
	client *Client
}

// CreateListingInput is the input for creating a P2P listing
type CreateListingInput struct {
	Type           string
	FiatCurrency   string
	FiatAmount     float64
	CryptoAmount   string
	CryptoCurrency string
	PaymentMethods []string
	ExchangeRate   string
	MinAmount      string
	MaxAmount      string
}

// CreateListing creates a new P2P listing
func (p *P2PAPI) CreateListing(input CreateListingInput) (*P2PListing, error) {
	data := map[string]interface{}{
		"type":           input.Type,
		"fiatCurrency":   input.FiatCurrency,
		"fiatAmount":     input.FiatAmount,
		"cryptoAmount":   input.CryptoAmount,
		"cryptoCurrency": input.CryptoCurrency,
	}

	if len(input.PaymentMethods) > 0 {
		data["paymentMethods"] = input.PaymentMethods
	}
	if input.ExchangeRate != "" {
		data["exchangeRate"] = input.ExchangeRate
	}
	if input.MinAmount != "" {
		data["minAmount"] = input.MinAmount
	}
	if input.MaxAmount != "" {
		data["maxAmount"] = input.MaxAmount
	}

	resp, err := p.client.doRequest("POST", "/api/v1/p2p/listings", data)
	if err != nil {
		return nil, err
	}

	listing := &P2PListing{}
	if err := mapToStruct(resp.Data, listing); err != nil {
		return nil, err
	}

	return listing, nil
}

// InitiateTradeInput is the input for initiating a P2P trade
type InitiateTradeInput struct {
	ListingID  string
	FiatAmount float64
}

// InitiateTrade initiates a P2P trade
func (p *P2PAPI) InitiateTrade(input InitiateTradeInput) (*P2PTrade, error) {
	data := map[string]interface{}{
		"listingId":  input.ListingID,
		"fiatAmount": input.FiatAmount,
	}

	resp, err := p.client.doRequest("POST", "/api/v1/p2p/trades", data)
	if err != nil {
		return nil, err
	}

	trade := &P2PTrade{}
	if err := mapToStruct(resp.Data, trade); err != nil {
		return nil, err
	}

	return trade, nil
}

// ConfirmPayment confirms payment for a trade
func (p *P2PAPI) ConfirmPayment(tradeID string) error {
	_, err := p.client.doRequest("POST", fmt.Sprintf("/api/v1/p2p/trades/%s/confirm", tradeID), nil)
	return err
}

// ReleaseCrypto releases crypto for a completed trade
func (p *P2PAPI) ReleaseCrypto(tradeID string) error {
	_, err := p.client.doRequest("POST", fmt.Sprintf("/api/v1/p2p/trades/%s/release", tradeID), nil)
	return err
}

// WebhooksAPI handles webhook operations
type WebhooksAPI struct {
	client *Client
}

// Register registers a webhook endpoint
func (w *WebhooksAPI) Register(url string, events []string, secret string) (*Webhook, error) {
	data := map[string]interface{}{
		"url":    url,
		"events": events,
	}

	if secret != "" {
		data["secret"] = secret
	}

	resp, err := w.client.doRequest("POST", "/api/v1/webhooks", data)
	if err != nil {
		return nil, err
	}

	webhook := &Webhook{}
	if err := mapToStruct(resp.Data, webhook); err != nil {
		return nil, err
	}

	return webhook, nil
}

// mapToStruct converts a map to a struct
func mapToStruct(m interface{}, s interface{}) error {
	data, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, s)
}

// snakeToCamel converts snake_case to camelCase
func snakeToCamel(s string) string {
	parts := strings.Split(s, "_")
	if len(parts) == 1 {
		return s
	}
	result := parts[0]
	for _, p := range parts[1:] {
		result += strings.ToUpper(string(p[0])) + p[1:]
	}
	return result
}
