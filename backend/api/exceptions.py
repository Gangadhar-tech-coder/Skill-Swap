"""
Custom exception handler to match FastAPI-style error responses.
FastAPI returns {"detail": "error message"}, so we do the same.
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException


def custom_exception_handler(exc, context):
    """
    Override DRF's default exception handler to return FastAPI-compatible error format.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Convert DRF's default format to FastAPI's {"detail": "..."} format
        detail = response.data.get("detail", None)
        if detail is None:
            # DRF sometimes returns {"field_name": ["error"]} format
            # Convert to a single detail string
            errors = []
            for field, messages in response.data.items():
                if isinstance(messages, list):
                    for msg in messages:
                        errors.append(f"{field}: {msg}")
                else:
                    errors.append(f"{field}: {messages}")
            detail = "; ".join(errors) if errors else "An error occurred"
            response.data = {"detail": detail}

    return response


class HttpError(APIException):
    """Custom exception that mimics FastAPI's HTTPException."""

    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail=detail)
