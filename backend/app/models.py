from datetime import date, datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator

class Search(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    query: str = Field(min_length=3, max_length=500)
    max_minutes: int | None = Field(default=None, ge=10, le=480)
    difficulty: Literal['easy', 'moderate', 'challenging'] | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    radius_km: float | None = Field(default=None, ge=0.1, le=200)
    recorded_after: datetime | None = None
    limit: int = Field(default=12, ge=1, le=24)

    @field_validator('recorded_after')
    @classmethod
    def aware_time(cls, value):
        if value and value.tzinfo is None:
            raise ValueError('recorded_after must include a timezone')
        return value

    @model_validator(mode='after')
    def location_is_complete(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError('Provide both latitude and longitude')
        if self.radius_km is not None and self.latitude is None:
            raise ValueError('A radius requires coordinates')
        return self

class Walk(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    place_id: int = Field(gt=0)
    minutes: int = Field(ge=1, le=1440)
    completed_on: date
    note: str = Field(default='', max_length=500)

    @field_validator('completed_on')
    @classmethod
    def not_future(cls, value):
        # A local calendar date can be one day ahead of UTC near the date line.
        from datetime import timedelta
        if value > datetime.now(timezone.utc).date() + timedelta(days=1):
            raise ValueError('Completion cannot be in the future')
        return value
