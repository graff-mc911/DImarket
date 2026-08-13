/**
 * Shared fillable form field schemas for Documents & Procedures.
 * Skeletons only — not verified legal clauses.
 */

import type { FormFieldDef } from './types'

export const repairContractFields: FormFieldDef[] = [
  { id: 'client_name', labelKey: 'docs.field.clientName', type: 'text', required: true, profileKey: 'full_name' },
  { id: 'client_phone', labelKey: 'docs.field.clientPhone', type: 'phone', profileKey: 'phone' },
  { id: 'client_email', labelKey: 'docs.field.clientEmail', type: 'email', profileKey: 'email' },
  { id: 'contractor_name', labelKey: 'docs.field.contractorName', type: 'text', required: true, profileKey: 'company_name' },
  { id: 'address', labelKey: 'docs.field.address', type: 'text', required: true, profileKey: 'location' },
  { id: 'work_description', labelKey: 'docs.field.workDescription', type: 'textarea', required: true },
  { id: 'materials', labelKey: 'docs.field.materials', type: 'textarea' },
  { id: 'price', labelKey: 'docs.field.price', type: 'number', required: true },
  { id: 'deadline', labelKey: 'docs.field.deadline', type: 'date' },
  { id: 'payment_terms', labelKey: 'docs.field.paymentTerms', type: 'textarea' },
  { id: 'warranty', labelKey: 'docs.field.warranty', type: 'textarea' },
  { id: 'extra_works', labelKey: 'docs.field.extraWorks', type: 'textarea' },
  { id: 'liability', labelKey: 'docs.field.liability', type: 'textarea' },
  { id: 'signed_at', labelKey: 'docs.field.signedAt', type: 'date' },
]

export const rentalContractFields: FormFieldDef[] = [
  { id: 'landlord_name', labelKey: 'docs.field.landlordName', type: 'text', required: true },
  { id: 'tenant_name', labelKey: 'docs.field.tenantName', type: 'text', required: true, profileKey: 'full_name' },
  { id: 'property_address', labelKey: 'docs.field.propertyAddress', type: 'text', required: true },
  { id: 'rent_amount', labelKey: 'docs.field.rentAmount', type: 'number', required: true },
  { id: 'deposit', labelKey: 'docs.field.deposit', type: 'number' },
  { id: 'start_date', labelKey: 'docs.field.startDate', type: 'date', required: true },
  { id: 'end_date', labelKey: 'docs.field.endDate', type: 'date' },
  { id: 'signed_at', labelKey: 'docs.field.signedAt', type: 'date' },
]

export const vehicleSaleFields: FormFieldDef[] = [
  { id: 'seller_name', labelKey: 'docs.field.sellerName', type: 'text', required: true },
  { id: 'buyer_name', labelKey: 'docs.field.buyerName', type: 'text', required: true, profileKey: 'full_name' },
  { id: 'vehicle_make', labelKey: 'docs.field.vehicleMake', type: 'text', required: true },
  { id: 'vehicle_model', labelKey: 'docs.field.vehicleModel', type: 'text', required: true },
  { id: 'vin', labelKey: 'docs.field.vin', type: 'text' },
  { id: 'plate', labelKey: 'docs.field.plate', type: 'text' },
  { id: 'price', labelKey: 'docs.field.price', type: 'number', required: true },
  { id: 'signed_at', labelKey: 'docs.field.signedAt', type: 'date' },
]

export const employmentFields: FormFieldDef[] = [
  { id: 'employer_name', labelKey: 'docs.field.employerName', type: 'text', required: true },
  { id: 'employee_name', labelKey: 'docs.field.employeeName', type: 'text', required: true, profileKey: 'full_name' },
  { id: 'job_title', labelKey: 'docs.field.jobTitle', type: 'text', required: true },
  { id: 'salary', labelKey: 'docs.field.salary', type: 'number' },
  { id: 'start_date', labelKey: 'docs.field.startDate', type: 'date' },
  { id: 'signed_at', labelKey: 'docs.field.signedAt', type: 'date' },
]

export const propertyPurchaseFields: FormFieldDef[] = [
  { id: 'seller_name', labelKey: 'docs.field.sellerName', type: 'text', required: true },
  { id: 'buyer_name', labelKey: 'docs.field.buyerName', type: 'text', required: true, profileKey: 'full_name' },
  { id: 'property_address', labelKey: 'docs.field.propertyAddress', type: 'text', required: true },
  { id: 'price', labelKey: 'docs.field.price', type: 'number', required: true },
  { id: 'signed_at', labelKey: 'docs.field.signedAt', type: 'date' },
]
