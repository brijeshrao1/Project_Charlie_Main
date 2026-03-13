"""
models.py — All Pydantic request/response models used across the application.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth / Login
# ---------------------------------------------------------------------------
class UserLogin(BaseModel):
    username: str
    password: str


# ---------------------------------------------------------------------------
# HDL / Upload
# ---------------------------------------------------------------------------
class ColumnRequest(BaseModel):
    file_content: str  # base64-encoded Excel bytes
    file_name: str


class GetAttributesRequest(BaseModel):
    customer_name: str
    instance_name: str
    business_object: str


class GetAttributesResponse(BaseModel):
    attributes: List[Dict[str, Any]]


class HDLUploadRequest(BaseModel):
    customer_name: str
    instance_name: str
    file_name: str
    file_content: str  # base64


class HDLTriggerRequest(BaseModel):
    customer_name: str
    instance_name: str
    content_id: str


class OracleUploadRequest(BaseModel):
    customer_name: str
    instance_name: str
    file_name: str
    file_content: str  # base64


# ---------------------------------------------------------------------------
# Transform
# ---------------------------------------------------------------------------
class TransformationPayload(BaseModel):
    transformations: List[Dict[str, Any]]
    file_content: str  # base64
    file_name: str


class ApplyTransformationPayload(BaseModel):
    file_content: str  # base64
    file_name: str
    column_mappings: Dict[str, str]


class ExcelRequest(BaseModel):
    file_content: str  # base64
    file_name: str


class BulkTransformationPayload(BaseModel):
    customer_name: str
    instance_name: str
    file_content: str       # base64
    file_name: str
    column_mappings: Optional[Dict[str, str]] = None
    transformations: Optional[List[Dict[str, Any]]] = None
    sheet_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
class AttributeConfig(BaseModel):
    attribute_name: str
    data_type: Optional[str] = None
    required: Optional[bool] = False
    lookup_values: Optional[List[str]] = None


class LookupItem(BaseModel):
    attribute_name: str
    lookup_values: List[str]


class ValidatePayload(BaseModel):
    customer_name: str
    instance_name: str
    file_content: str       # base64
    file_name: str
    sheet_name: Optional[str] = None
    attributes: Optional[List[AttributeConfig]] = None
    required_columns: Optional[List[str]] = None
    all_lookups: Optional[List[LookupItem]] = None


class DeltaLoadPayload(BaseModel):
    customer_name: str
    instance_name: str
    file_content: str           # base64 — current file
    delta_file_content: str     # base64 — previous/reference file
    file_name: str
    delta_file_name: str
    sheet_name: Optional[str] = None
    hire_actions: Optional[List[str]] = None
    term_actions: Optional[List[str]] = None
    rehire_actions: Optional[List[str]] = None
    gt_actions: Optional[List[str]] = None


class AttributeValidationData(BaseModel):
    attribute_name: str
    required: Optional[bool] = False
    data_type: Optional[str] = None
    lookup_values: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# HDL Setup / Mapping
# ---------------------------------------------------------------------------
class HDLSetupPayload(BaseModel):
    customer_name: str
    instance_name: str
    setup_data: Dict[str, Any]


class AttributeMappingPayload(BaseModel):
    customer_name: str
    instance_name: str
    mappings: Dict[str, Any]


# ---------------------------------------------------------------------------
# Customer / Hierarchy management
# ---------------------------------------------------------------------------
class InstanceModel(BaseModel):
    instance_name: str
    instance_data: Optional[Dict[str, Any]] = None


class CustomerModel(BaseModel):
    customer_name: str
    instances: Optional[List[InstanceModel]] = None


class CustomerUpdateModel(BaseModel):
    customer_name: str
    instance_name: str
    update_data: Optional[Dict[str, Any]] = None


class CustomerDeleteModel(BaseModel):
    customer_name: str
    instance_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Oracle / SOAP
# ---------------------------------------------------------------------------
class LookupDataAPIOracle(BaseModel):
    customer_name: str
    instance_name: str
    lookup_type: Optional[str] = None


class mandatoryFieldsReqOracle(BaseModel):
    customer_name: str
    instance_name: str
    business_object: Optional[str] = None


class OracleValueRequest(BaseModel):
    customer_name: str
    instance_name: str
    attribute_name: str
    value: Any
    defined_type: Optional[str] = None


# ---------------------------------------------------------------------------
# File Bundle / Zip
# ---------------------------------------------------------------------------
class FileBundleRequest(BaseModel):
    files: List[Dict[str, str]]   # list of {file_name, file_content (base64)}
    bundle_name: Optional[str] = "bundle"


# ---------------------------------------------------------------------------
# Precheck
# ---------------------------------------------------------------------------
class PrecheckReportRequest(BaseModel):
    customer_name: str
    instance_name: str
    component_id: Optional[str] = None


class ValidationRequest(BaseModel):
    report_id: str
    customer_name: str
    instance_name: str


# ---------------------------------------------------------------------------
# HDL Job
# ---------------------------------------------------------------------------
class HDLJob(BaseModel):
    job_id: str
    customer: str
    instance: str
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
