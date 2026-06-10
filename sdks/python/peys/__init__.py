"""
Peys Python SDK

A Python SDK for interacting with the Peys payment API.
"""

import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from datetime import datetime


class PeysException(Exception):
    """Base exception for Peys errors."""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        status_code: Optional[int] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


@dataclass
class Payment:
    """Represents a payment."""

    id: str
    payment_id: str
    amount: int
    token: str
    status: str
    expires_at: str
    claim_link: Optional[str] = None
    created_at: Optional[str] = None
    claimed_at: Optional[str] = None
    refunded_at: Optional[str] = None
    memo: Optional[str] = None


@dataclass
class Webhook:
    """Represents a webhook."""

    id: str
    url: str
    events: List[str]
    is_active: bool
    created_at: str


@dataclass
class Usage:
    """Represents API usage."""

    month: str
    api_calls: int
    limit: int
    remaining: int


@dataclass
class Account:
    """Represents account information."""

    api_key_id: str
    api_key_name: str
    tier: str
    monthly_limit: int
    email: Optional[str] = None
    created_at: Optional[str] = None


class Peys:
    """Peys API client."""

    def __init__(self, api_key: str, base_url: str = "https://api.peys.io"):
        """
        Initialize the Peys client.

        Args:
            api_key: Your Peys API key
            base_url: API base URL (default: https://api.peys.io)
        """
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Content-Type": "application/json",
                "X-API-Key": api_key,
            }
        )

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make an API request."""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)

        if not response.ok:
            error = response.json() if response.content else {"error": "Request failed"}
            raise PeysException(
                error.get("error", error.get("message", "Request failed")),
                status_code=response.status_code,
            )

        return response.json()

    def create_payment(
        self,
        recipient: str,
        amount: int,
        token: str,
        memo: Optional[str] = None,
        expires_in: Optional[int] = None,
    ) -> Payment:
        """
        Create a new payment.

        Args:
            recipient: Recipient email or wallet address
            amount: Payment amount (in smallest token units)
            token: Token symbol (e.g., 'USDC', 'USDT')
            memo: Optional memo/description
            expires_in: Optional expiry in days (default: 7)

        Returns:
            Payment object
        """
        data = {
            "recipient": recipient,
            "amount": amount,
            "token": token,
        }
        if memo:
            data["memo"] = memo
        if expires_in:
            data["expiresIn"] = expires_in

        result = self._request("POST", "/v1/payments", json=data)
        return Payment(**result)

    def get_payment(self, payment_id: str) -> Payment:
        """
        Get payment details.

        Args:
            payment_id: The payment ID

        Returns:
            Payment object
        """
        result = self._request("GET", f"/v1/payments/{payment_id}")
        return Payment(**result)

    def list_payments(
        self, limit: int = 10, offset: int = 0, status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List payments.

        Args:
            limit: Number of results (default: 10)
            offset: Pagination offset
            status: Filter by status

        Returns:
            Dict with 'data' and 'pagination' keys
        """
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status

        return self._request("GET", "/v1/payments", params=params)

    def claim_payment(
        self, payment_id: str, recipient_wallet: str, secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Claim a payment.

        Args:
            payment_id: The payment ID
            recipient_wallet: Wallet address to receive funds
            secret: Optional secret (if not using claim link)

        Returns:
            Dict with success and claimedAt
        """
        data = {"recipientWallet": recipient_wallet}
        if secret:
            data["secret"] = secret

        return self._request("POST", f"/v1/payments/{payment_id}/claim", json=data)

    def refund_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Refund an expired payment.

        Args:
            payment_id: The payment ID

        Returns:
            Dict with success and refundedAt
        """
        return self._request("POST", f"/v1/payments/{payment_id}/refund")

    def create_webhook(
        self, url: str, events: Optional[List[str]] = None, secret: Optional[str] = None
    ) -> Webhook:
        """
        Create a webhook.

        Args:
            url: Webhook URL
            events: List of events to subscribe to
            secret: Optional custom secret

        Returns:
            Webhook object
        """
        data = {"url": url}
        if events:
            data["events"] = events
        if secret:
            data["secret"] = secret

        result = self._request("POST", "/v1/webhooks", json=data)
        return Webhook(**result)

    def list_webhooks(self) -> List[Webhook]:
        """
        List all webhooks.

        Returns:
            List of Webhook objects
        """
        result = self._request("GET", "/v1/webhooks")
        return [Webhook(**w) for w in result.get("data", [])]

    def delete_webhook(self, webhook_id: str) -> Dict[str, Any]:
        """
        Delete a webhook.

        Args:
            webhook_id: The webhook ID

        Returns:
            Dict with success message
        """
        return self._request("DELETE", f"/v1/webhooks/{webhook_id}")

    def get_usage(self) -> Usage:
        """
        Get current API usage.

        Returns:
            Usage object
        """
        result = self._request("GET", "/v1/usage")
        return Usage(
            month=result["month"],
            api_calls=result["apiCalls"],
            limit=result["limit"],
            remaining=result["remaining"],
        )

    def get_account(self) -> Account:
        """
        Get account information.

        Returns:
            Account object
        """
        result = self._request("GET", "/v1/account")
        return Account(**result)

    def get_pricing(self) -> Dict[str, Any]:
        """
        Get pricing tiers.

        Returns:
            Dict with pricing information
        """
        return self._request("GET", "/v1/pricing")

    def close(self):
        """Close the HTTP session."""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
