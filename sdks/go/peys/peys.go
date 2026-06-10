package peys

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const (
	DefaultBaseURL = "https://api.peys.io"
	APIVersion     = "v1"
)

// Client represents a Peys API client
type Client struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

// PeysError represents an API error
type PeysError struct {
	Message    string `json:"error"`
	Code       string `json:"code,omitempty"`
	StatusCode int
}

func (e *PeysError) Error() string {
	return e.Message
}

// NewClient creates a new Peys client
func NewClient(apiKey string, opts ...Option) (*Client, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("api key is required")
	}

	client := &Client{
		APIKey:  apiKey,
		BaseURL: DefaultBaseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}

	for _, opt := range opts {
		opt(client)
	}

	return client, nil
}

// Option is a functional option for Client
type Option func(*Client)

// WithBaseURL sets the base URL
func WithBaseURL(baseURL string) Option {
	return func(c *Client) {
		c.BaseURL = baseURL
	}
}

// WithHTTPClient sets a custom HTTP client
func WithHTTPClient(httpClient *http.Client) Option {
	return func(c *Client) {
		c.HTTPClient = httpClient
	}
}

func (c *Client) request(method, endpoint string, body interface{}, queryParams map[string]string) ([]byte, error) {
	parsedURL, err := url.Parse(c.BaseURL)
	if err != nil {
		return nil, err
	}

	parsedURL.Path = fmt.Sprintf("/%s/%s", APIVersion, endpoint)

	if len(queryParams) > 0 {
		q := parsedURL.Query()
		for k, v := range queryParams {
			q.Add(k, v)
		}
		parsedURL.RawQuery = q.Encode()
	}

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequest(method, parsedURL.String(), reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		var peysErr PeysError
		if json.Unmarshal(respBody, &peysErr) == nil {
			peysErr.StatusCode = resp.StatusCode
			return nil, &peysErr
		}
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// Payment represents a payment
type Payment struct {
	ID         string `json:"id"`
	PaymentID  string `json:"paymentId"`
	Amount     int    `json:"amount"`
	Token      string `json:"token"`
	Status     string `json:"status"`
	ExpiresAt  string `json:"expiresAt"`
	ClaimLink  string `json:"claimLink,omitempty"`
	CreatedAt  string `json:"createdAt,omitempty"`
	ClaimedAt  string `json:"claimedAt,omitempty"`
	RefundedAt string `json:"refundedAt,omitempty"`
	Memo       string `json:"memo,omitempty"`
}

// CreatePaymentOptions represents options for creating a payment
type CreatePaymentOptions struct {
	Recipient string `json:"recipient"`
	Amount    int    `json:"amount"`
	Token     string `json:"token"`
	Memo      string `json:"memo,omitempty"`
	ExpiresIn int    `json:"expiresIn,omitempty"`
}

// CreatePayment creates a new payment
func (c *Client) CreatePayment(opts CreatePaymentOptions) (*Payment, error) {
	resp, err := c.request("POST", "payments", opts, nil)
	if err != nil {
		return nil, err
	}

	var payment Payment
	if err := json.Unmarshal(resp, &payment); err != nil {
		return nil, err
	}

	return &payment, nil
}

// GetPayment gets a payment by ID
func (c *Client) GetPayment(paymentID string) (*Payment, error) {
	resp, err := c.request("GET", fmt.Sprintf("payments/%s", paymentID), nil, nil)
	if err != nil {
		return nil, err
	}

	var payment Payment
	if err := json.Unmarshal(resp, &payment); err != nil {
		return nil, err
	}

	return &payment, nil
}

// ListPaymentsOptions represents options for listing payments
type ListPaymentsOptions struct {
	Limit  int
	Offset int
	Status string
}

// PaymentListResponse represents a list of payments with pagination
type PaymentListResponse struct {
	Data       []Payment  `json:"data"`
	Pagination Pagination `json:"pagination"`
}

// Pagination represents pagination info
type Pagination struct {
	Total   int  `json:"total"`
	Limit   int  `json:"limit"`
	Offset  int  `json:"offset"`
	HasMore bool `json:"hasMore"`
}

// ListPayments lists payments
func (c *Client) ListPayments(opts ListPaymentsOptions) (*PaymentListResponse, error) {
	params := make(map[string]string)
	if opts.Limit > 0 {
		params["limit"] = fmt.Sprintf("%d", opts.Limit)
	}
	if opts.Offset > 0 {
		params["offset"] = fmt.Sprintf("%d", opts.Offset)
	}
	if opts.Status != "" {
		params["status"] = opts.Status
	}

	resp, err := c.request("GET", "payments", nil, params)
	if err != nil {
		return nil, err
	}

	var listResp PaymentListResponse
	if err := json.Unmarshal(resp, &listResp); err != nil {
		return nil, err
	}

	return &listResp, nil
}

// ClaimPaymentOptions represents options for claiming a payment
type ClaimPaymentOptions struct {
	RecipientWallet string `json:"recipientWallet"`
	Secret          string `json:"secret,omitempty"`
}

// ClaimPayment claims a payment
func (c *Client) ClaimPayment(paymentID string, opts ClaimPaymentOptions) (map[string]interface{}, error) {
	resp, err := c.request("POST", fmt.Sprintf("payments/%s/claim", paymentID), opts, nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// RefundPayment refunds a payment
func (c *Client) RefundPayment(paymentID string) (map[string]interface{}, error) {
	resp, err := c.request("POST", fmt.Sprintf("payments/%s/refund", paymentID), nil, nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// Webhook represents a webhook
type Webhook struct {
	ID        string   `json:"id"`
	URL       string   `json:"url"`
	Events    []string `json:"events"`
	IsActive  bool     `json:"isActive"`
	CreatedAt string   `json:"createdAt"`
}

// CreateWebhookOptions represents options for creating a webhook
type CreateWebhookOptions struct {
	URL    string   `json:"url"`
	Events []string `json:"events,omitempty"`
	Secret string   `json:"secret,omitempty"`
}

// CreateWebhook creates a webhook
func (c *Client) CreateWebhook(opts CreateWebhookOptions) (*Webhook, error) {
	resp, err := c.request("POST", "webhooks", opts, nil)
	if err != nil {
		return nil, err
	}

	var webhook Webhook
	if err := json.Unmarshal(resp, &webhook); err != nil {
		return nil, err
	}

	return &webhook, nil
}

// ListWebhooks lists webhooks
func (c *Client) ListWebhooks() ([]Webhook, error) {
	resp, err := c.request("GET", "webhooks", nil, nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Data []Webhook `json:"data"`
	}
	if err := json.Unmarshal(resp, &result); err != nil {
		return nil, err
	}

	return result.Data, nil
}

// DeleteWebhook deletes a webhook
func (c *Client) DeleteWebhook(webhookID string) error {
	_, err := c.request("DELETE", fmt.Sprintf("webhooks/%s", webhookID), nil, nil)
	return err
}

// Usage represents API usage
type Usage struct {
	Month     string `json:"month"`
	APICalls  int    `json:"apiCalls"`
	Limit     int    `json:"limit"`
	Remaining int    `json:"remaining"`
}

// GetUsage gets current API usage
func (c *Client) GetUsage() (*Usage, error) {
	resp, err := c.request("GET", "usage", nil, nil)
	if err != nil {
		return nil, err
	}

	var usage Usage
	if err := json.Unmarshal(resp, &usage); err != nil {
		return nil, err
	}

	return &usage, nil
}

// Account represents account info
type Account struct {
	APiKeyID     string `json:"apiKeyId"`
	APIKeyName   string `json:"apiKeyName"`
	Tier         string `json:"tier"`
	MonthlyLimit int    `json:"monthlyLimit"`
	Email        string `json:"email,omitempty"`
	CreatedAt    string `json:"createdAt,omitempty"`
}

// GetAccount gets account information
func (c *Client) GetAccount() (*Account, error) {
	resp, err := c.request("GET", "account", nil, nil)
	if err != nil {
		return nil, err
	}

	var account Account
	if err := json.Unmarshal(resp, &account); err != nil {
		return nil, err
	}

	return &account, nil
}

// PricingTier represents a pricing tier
type PricingTier struct {
	Name             string   `json:"name"`
	MonthlyFee       int      `json:"monthly_fee"`
	APICallsIncluded int      `json:"api_calls_included"`
	PerRequestFee    float64  `json:"per_request_fee"`
	RateLimit        int      `json:"rate_limit"`
	Features         []string `json:"features"`
}

// PricingResponse represents pricing information
type PricingResponse struct {
	Tiers    map[string]PricingTier `json:"tiers"`
	Currency string                 `json:"currency"`
	Period   string                 `json:"period"`
}

// GetPricing gets pricing tiers
func (c *Client) GetPricing() (*PricingResponse, error) {
	resp, err := c.request("GET", "pricing", nil, nil)
	if err != nil {
		return nil, err
	}

	var pricing PricingResponse
	if err := json.Unmarshal(resp, &pricing); err != nil {
		return nil, err
	}

	return &pricing, nil
}
