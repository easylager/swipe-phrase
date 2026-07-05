

from pydantic import BaseModel, field_validator, Field, computed_field
from typing import Literal


#1. Custom validators for business rules


class Order(BaseModel):
    items: list[str]
    total: float
    discount_code: str | None = None

    @field_validator('total')
    def positive_total(cls, v):
        # Fail fast — invalid data never reaches your database
        if v <= 0:
            raise ValueError('Total must be positive — no free lunches')
        return v

    @field_validator('discount_code')
    def validate_discount(cls, v):
        # Real business logic: only valid codes from our system
        if v and not v.startswith('DISC-'):
            raise ValueError('Invalid discount code format')
        return v



# 2. Aliases for ugly external APIs


class StripeWebhook(BaseModel):
    # Stripe sends camelCase, we keep our code clean
    payment_intent: str = Field(alias='paymentIntent')
    customer_email: str = Field(alias='customerEmail')
    amount_received: int = Field(alias='amountReceived')
    # Now we can do webhook.payment_intent instead of webhook['paymentIntent']


# 3. Optional + default = explicit intent

class NotificationConfig(BaseModel):
    # Default if missing — sensible fallback
    retry_count: int = 3
    timeout_seconds: int = 30
    
    # None means "not configured" — you handle it separately
    webhook_url: str | None = None  
    slack_channel: str | None = None
    
    # Constrained value — prevents misconfiguration
    max_retries: int = Field(default=5, ge=1, le=10)


# 4. Discriminated unions for event-driven systems

class SuccessData(BaseModel):
    transaction_id: str
    amount: float
    receipt_url: str

class FailureData(BaseModel):
    error_code: str
    error_message: str
    retry_after: int | None = None

class PaymentWebhook(BaseModel):
    # Different shapes based on status
    status: Literal['paid', 'failed', 'refunded']
    data: SuccessData | FailureData = Field(discriminator='status')
    # status='paid' → data must be SuccessData
    # status='failed' → data must be FailureData
    # Pydantic enforces this automatically


# 5. Serialization with computed fields

class ShoppingCart(BaseModel):
    items: list[dict]  # each has {'name': str, 'price': float, 'qty': int}
    shipping_cost: float = 0.0

    @computed_field
    @property
    def subtotal(self) -> float:
        # Calculated from items — no manual updates needed
        return sum(item['price'] * item['qty'] for item in self.items)

    @computed_field
    @property
    def total(self) -> float:
        # Auto-updates when items change or shipping changes
        return self.subtotal + self.shipping_cost