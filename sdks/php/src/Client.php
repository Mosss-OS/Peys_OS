<?php

/**
 * Peys PHP SDK
 * 
 * Official Peys Payment SDK for PHP
 * 
 * Requirements:
 * - PHP 8.1+
 * - cURL extension
 * - JSON extension
 * 
 * Installation:
 * composer require peys/peys-sdk
 * 
 * Usage:
 * <?php
 * 
 * use Peys\PeysClient;
 * 
 * $client = new PeysClient('pk_live_xxx');
 * 
 * // Create a payment
 * $payment = $client->payments->create([
 *     'amount' => '1000000',
 *     'currency' => 'USDC',
 *     'recipient' => '0x123...'
 * ]);
 * 
 * echo $payment->id;
 */

declare(strict_types=1);

namespace Peys;

/**
 * Main Peys API client
 */
class PeysClient
{
    private string $apiKey;
    private string $baseUrl;
    private string $network;
    private int $timeout;

    /**
     * Create a new Peys client
     * 
     * @param string $apiKey Your Peys API key
     * @param array $config Optional configuration
     */
    public function __construct(string $apiKey, array $config = [])
    {
        if (empty($apiKey)) {
            throw new \InvalidArgumentException('API key is required');
        }

        $this->apiKey = $apiKey;
        $this->baseUrl = $config['baseUrl'] ?? 'https://api.peys.app';
        $this->network = $config['network'] ?? 'base-sepolia';
        $this->timeout = $config['timeout'] ?? 30;
    }

    /**
     * Get the base URL
     * 
     * @return string
     */
    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Get the network
     * 
     * @return string
     */
    public function getNetwork(): string
    {
        return $this->network;
    }

    /**
     * Make an API request
     * 
     * @param string $method HTTP method
     * @param string $endpoint API endpoint
     * @param array|null $data Request data
     * @return array Response data
     */
    public function request(string $method, string $endpoint, ?array $data = null): array
    {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        
        $headers = [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey,
        ];

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);

        if ($error) {
            throw new PeysException('Request failed: ' . $error);
        }

        $result = json_decode($response, true);

        if ($result === null) {
            throw new PeysException('Invalid JSON response');
        }

        if ($httpCode >= 400 || ($result['status'] ?? '') === 'error') {
            throw new PeysException($result['message'] ?? 'Request failed');
        }

        return $result['data'] ?? [];
    }

    /**
     * Generate a commit hash for payment security
     * 
     * @return string
     */
    public function generateCommitHash(): string
    {
        return hash('sha256', bin2hex(random_bytes(32)));
    }

    /**
     * Get payments API
     * 
     * @return PaymentsAPI
     */
    public function getPayments(): PaymentsAPI
    {
        return new PaymentsAPI($this);
    }

    /**
     * Get payment links API
     * 
     * @return LinksAPI
     */
    public function getLinks(): LinksAPI
    {
        return new LinksAPI($this);
    }

    /**
     * Get fiat operations API
     * 
     * @return FiatAPI
     */
    public function getFiat(): FiatAPI
    {
        return new FiatAPI($this);
    }

    /**
     * Get P2P marketplace API
     * 
     * @return P2PAPI
     */
    public function getP2P(): P2PAPI
    {
        return new P2PAPI($this);
    }

    /**
     * Get webhooks API
     * 
     * @return WebhooksAPI
     */
    public function getWebhooks(): WebhooksAPI
    {
        return new WebhooksAPI($this);
    }
}

/**
 * Peys Exception
 */
class PeysException extends \Exception
{
}

/**
 * Payments API
 */
class PaymentsAPI
{
    private PeysClient $client;

    public function __construct(PeysClient $client)
    {
        $this->client = $client;
    }

    /**
     * Create a new payment
     * 
     * @param array $options Payment options
     * @return array Payment details
     */
    public function create(array $options): array
    {
        $data = [
            'amount' => $options['amount'],
            'currency' => $options['currency'] ?? 'USDC',
            'recipientAddress' => $options['recipient'],
            'network' => $this->client->getNetwork(),
            'commitHash' => $this->client->generateCommitHash(),
        ];

        $result = $this->client->request('POST', '/api/v1/payments/initiate', $data);
        $result['claimLink'] = $this->client->getBaseUrl() . '/claim/' . $result['id'];
        
        return $result;
    }

    /**
     * Get payment by ID
     * 
     * @param string $paymentId Payment ID
     * @return array Payment details
     */
    public function get(string $paymentId): array
    {
        return $this->client->request('GET', '/api/v1/payments/' . $paymentId);
    }

    /**
     * Confirm a payment
     * 
     * @param string $paymentId Payment ID
     * @param string $secret Reveal secret
     * @return array Updated payment
     */
    public function confirm(string $paymentId, string $secret): array
    {
        return $this->client->request('POST', '/api/v1/payments/confirm', [
            'paymentId' => $paymentId,
            'revealSecret' => $secret,
        ]);
    }

    /**
     * Refund a payment
     * 
     * @param string $paymentId Payment ID
     * @param string|null $reason Optional refund reason
     * @return array Refunded payment
     */
    public function refund(string $paymentId, ?string $reason = null): array
    {
        $data = ['paymentId' => $paymentId];
        if ($reason !== null) {
            $data['reason'] = $reason;
        }
        
        return $this->client->request('POST', '/api/v1/payments/refund', $data);
    }

    /**
     * List payments
     * 
     * @param array $params Query parameters
     * @return array Payments list
     */
    public function list(array $params = []): array
    {
        $query = http_build_query([
            'page' => $params['page'] ?? 1,
            'limit' => $params['limit'] ?? 20,
            'status' => $params['status'] ?? null,
        ]);
        
        return $this->client->request('GET', '/api/v1/transactions?' . $query);
    }
}

/**
 * Payment Links API
 */
class LinksAPI
{
    private PeysClient $client;

    public function __construct(PeysClient $client)
    {
        $this->client = $client;
    }

    /**
     * Create a payment link
     * 
     * @param array $options Link options
     * @return array Link details
     */
    public function create(array $options): array
    {
        $data = [
            'title' => $options['title'],
            'amount' => $options['amount'],
            'currency' => $options['currency'],
            'recipientAddress' => $options['recipientAddress'],
            'network' => $this->client->getNetwork(),
        ];

        if (isset($options['description'])) {
            $data['description'] = $options['description'];
        }
        if (isset($options['expiresAt'])) {
            $data['expiresAt'] = $options['expiresAt'];
        }

        return $this->client->request('POST', '/api/v1/payments/links', $data);
    }

    /**
     * Get payment link by ID
     * 
     * @param string $linkId Link ID
     * @return array Link details
     */
    public function get(string $linkId): array
    {
        return $this->client->request('GET', '/api/v1/payments/links/' . $linkId);
    }

    /**
     * List payment links
     * 
     * @param array $params Query parameters
     * @return array Links list
     */
    public function list(array $params = []): array
    {
        $query = http_build_query([
            'page' => $params['page'] ?? 1,
            'limit' => $params['limit'] ?? 20,
        ]);
        
        return $this->client->request('GET', '/api/v1/payments/links?' . $query);
    }
}

/**
 * Fiat Operations API
 */
class FiatAPI
{
    private PeysClient $client;

    public function __construct(PeysClient $client)
    {
        $this->client = $client;
    }

    /**
     * Withdraw to African bank accounts
     * 
     * @param array $options Withdrawal options
     * @return array Withdrawal details
     */
    public function withdraw(array $options): array
    {
        return $this->client->request('POST', '/api/v1/fiat/withdraw', [
            'amount' => $options['amount'],
            'currency' => $options['currency'],
            'bankCode' => $options['bankCode'],
            'accountNumber' => $options['accountNumber'],
            'accountName' => $options['accountName'],
            'narration' => $options['narration'] ?? null,
        ]);
    }

    /**
     * Pay bills (airtime, data, TV, electricity)
     * 
     * @param array $options Bill payment options
     * @return array Payment details
     */
    public function payBill(array $options): array
    {
        $data = [
            'type' => $options['type'],
            'provider' => $options['provider'],
            'amount' => $options['amount'],
        ];

        if (isset($options['phone'])) {
            $data['phone'] = $options['phone'];
        }
        if (isset($options['smartCardNumber'])) {
            $data['smartCardNumber'] = $options['smartCardNumber'];
        }
        if (isset($options['meterNumber'])) {
            $data['meterNumber'] = $options['meterNumber'];
        }

        return $this->client->request('POST', '/api/v1/fiat/bills', $data);
    }
}

/**
 * P2P Marketplace API
 */
class P2PAPI
{
    private PeysClient $client;

    public function __construct(PeysClient $client)
    {
        $this->client = $client;
    }

    /**
     * Create a P2P listing
     * 
     * @param array $options Listing options
     * @return array Listing details
     */
    public function createListing(array $options): array
    {
        $data = [
            'type' => $options['type'],
            'fiatCurrency' => $options['fiatCurrency'],
            'fiatAmount' => $options['fiatAmount'],
            'cryptoAmount' => $options['cryptoAmount'],
            'cryptoCurrency' => $options['cryptoCurrency'] ?? 'USDC',
        ];

        if (isset($options['paymentMethods'])) {
            $data['paymentMethods'] = $options['paymentMethods'];
        }
        if (isset($options['exchangeRate'])) {
            $data['exchangeRate'] = $options['exchangeRate'];
        }
        if (isset($options['minAmount'])) {
            $data['minAmount'] = $options['minAmount'];
        }
        if (isset($options['maxAmount'])) {
            $data['maxAmount'] = $options['maxAmount'];
        }

        return $this->client->request('POST', '/api/v1/p2p/listings', $data);
    }

    /**
     * Initiate a P2P trade
     * 
     * @param array $options Trade options
     * @return array Trade details
     */
    public function initiateTrade(array $options): array
    {
        return $this->client->request('POST', '/api/v1/p2p/trades', [
            'listingId' => $options['listingId'],
            'fiatAmount' => $options['fiatAmount'],
        ]);
    }

    /**
     * Confirm payment for a trade
     * 
     * @param string $tradeId Trade ID
     * @return array Updated trade
     */
    public function confirmPayment(string $tradeId): array
    {
        return $this->client->request('POST', '/api/v1/p2p/trades/' . $tradeId . '/confirm');
    }

    /**
     * Release crypto for a completed trade
     * 
     * @param string $tradeId Trade ID
     * @return array Updated trade
     */
    public function releaseCrypto(string $tradeId): array
    {
        return $this->client->request('POST', '/api/v1/p2p/trades/' . $tradeId . '/release');
    }
}

/**
 * Webhooks API
 */
class WebhooksAPI
{
    private PeysClient $client;

    public function __construct(PeysClient $client)
    {
        $this->client = $client;
    }

    /**
     * Register a webhook endpoint
     * 
     * @param array $options Webhook options
     * @return array Webhook details
     */
    public function register(array $options): array
    {
        $data = [
            'url' => $options['url'],
            'events' => $options['events'],
        ];

        if (isset($options['secret'])) {
            $data['secret'] = $options['secret'];
        }

        return $this->client->request('POST', '/api/v1/webhooks', $data);
    }
}

/**
 * Webhook Verifier
 */
class WebhookVerifier
{
    private string $secret;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }

    /**
     * Verify a webhook signature
     * 
     * @param string $payload Raw payload
     * @param string $signature Signature from header
     * @return bool
     */
    public function verify(string $payload, string $signature): bool
    {
        $expected = hash_hmac('sha256', $payload, $this->secret);
        return hash_equals($expected, $signature);
    }
}
