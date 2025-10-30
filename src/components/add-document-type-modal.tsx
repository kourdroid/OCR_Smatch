"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  X, 
  Plus, 
  FileText, 
  Palette, 
  Settings, 
  Smile, 
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Enhanced field interface to support complex schemas
interface SchemaField {
  id: string;
  name: string;
  displayLabel: string;
  type: "string" | "number" | "integer" | "boolean" | "date" | "datetime" | "email" | "phone" | "url" | "textarea" | "array" | "object" | "enum";
  required: boolean;
  description?: string;
  // Constraints
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  // For enum type
  enumValues?: string[];
  // For array type
  arrayItemType?: Omit<SchemaField, 'id' | 'name' | 'displayLabel'>;
  // For object type
  objectProperties?: SchemaField[];
  // Nesting level for UI
  level?: number;
}

interface AddDocumentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (documentType: {
    name: string;
    description: string;
    color: string;
    icon: string;
    targetTable: string;
    requiredFields: any; // Will be converted to proper schema format
  }) => void;
}

const FIELD_TYPES = [
  { value: "string", label: "Text", description: "Simple text field" },
  { value: "number", label: "Number", description: "Decimal number" },
  { value: "integer", label: "Integer", description: "Whole number" },
  { value: "boolean", label: "Boolean", description: "True/False" },
  { value: "date", label: "Date", description: "Date field" },
  { value: "datetime", label: "DateTime", description: "Date and time" },
  { value: "email", label: "Email", description: "Email address" },
  { value: "phone", label: "Phone", description: "Phone number" },
  { value: "url", label: "URL", description: "Web address" },
  { value: "textarea", label: "Long Text", description: "Multi-line text" },
  { value: "enum", label: "Dropdown", description: "Predefined options" },
  { value: "array", label: "Array", description: "List of items" },
  { value: "object", label: "Object", description: "Nested structure" },
];

const COLOR_OPTIONS = [
  { color: "#3B82F6", name: "Blue" },
  { color: "#10B981", name: "Green" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#EF4444", name: "Red" },
  { color: "#8B5CF6", name: "Purple" },
  { color: "#F97316", name: "Orange" },
  { color: "#06B6D4", name: "Cyan" },
  { color: "#84CC16", name: "Lime" },
];

const ICON_OPTIONS = [
  { icon: "📄", name: "Document" },
  { icon: "🧾", name: "Invoice" },
  { icon: "📦", name: "Package" },
  { icon: "📋", name: "Clipboard" },
  { icon: "🔄", name: "Movement" },
  { icon: "💰", name: "Money" },
  { icon: "📊", name: "Chart" },
  { icon: "📝", name: "Note" },
  { icon: "🏷️", name: "Tag" },
  { icon: "📑", name: "Pages" },
  { icon: "🗂️", name: "Folder" },
  { icon: "📈", name: "Growth" },
  { icon: "🎯", name: "Target" },
  { icon: "⚡", name: "Energy" },
  { icon: "🔧", name: "Tool" },
  { icon: "🎨", name: "Design" },
  { icon: "🏢", name: "Business" },
  { icon: "📞", name: "Contact" },
  { icon: "🌐", name: "Global" },
  { icon: "🔒", name: "Security" },
  { icon: "📅", name: "Calendar" },
  { icon: "💼", name: "Briefcase" },
  { icon: "🎪", name: "Event" },
  { icon: "🚀", name: "Launch" },
];

// Field component for rendering individual fields
const FieldEditor: React.FC<{
  field: SchemaField;
  onUpdate: (field: SchemaField) => void;
  onDelete: () => void;
  onAddChild?: () => void;
  level?: number;
}> = ({ field, onUpdate, onDelete, onAddChild, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [enumInput, setEnumInput] = useState("");

  const handleFieldChange = (updates: Partial<SchemaField>) => {
    onUpdate({ ...field, ...updates });
  };

  const addEnumValue = () => {
    if (enumInput.trim()) {
      const newValues = [...(field.enumValues || []), enumInput.trim()];
      handleFieldChange({ enumValues: newValues });
      setEnumInput("");
    }
  };

  const removeEnumValue = (index: number) => {
    const newValues = field.enumValues?.filter((_, i) => i !== index) || [];
    handleFieldChange({ enumValues: newValues });
  };

  const indent = level * 20;

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-white shadow-sm" style={{ marginLeft: `${indent}px` }}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>{field.displayLabel || field.name || "New Field"}</span>
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {(field.type === "object" || field.type === "array") && onAddChild && (
              <Button size="sm" variant="ghost" onClick={onAddChild}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="space-y-6">
          {/* Basic field properties */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`field-name-${field.id}`} className="text-sm font-medium">Field Name</Label>
              <Input
                id={`field-name-${field.id}`}
                value={field.name}
                onChange={(e) => handleFieldChange({ name: e.target.value })}
                placeholder="field_name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`field-label-${field.id}`} className="text-sm font-medium">Display Label</Label>
              <Input
                id={`field-label-${field.id}`}
                value={field.displayLabel}
                onChange={(e) => handleFieldChange({ displayLabel: e.target.value })}
                placeholder="Field Label"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`field-type-${field.id}`} className="text-sm font-medium">Field Type</Label>
              <Select value={field.type} onValueChange={(value: any) => handleFieldChange({ type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id={`field-required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) => handleFieldChange({ required: !!checked })}
              />
              <Label htmlFor={`field-required-${field.id}`} className="text-sm font-medium">Required</Label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor={`field-description-${field.id}`} className="text-sm font-medium">Description (Optional)</Label>
            <Textarea
              id={`field-description-${field.id}`}
              value={field.description || ""}
              onChange={(e) => handleFieldChange({ description: e.target.value })}
              placeholder="Field description..."
              rows={3}
            />
          </div>

          {/* Type-specific constraints */}
          {(field.type === "string" || field.type === "textarea") && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor={`field-minlength-${field.id}`} className="text-sm font-medium">Min Length</Label>
                <Input
                  id={`field-minlength-${field.id}`}
                  type="number"
                  value={field.minLength || ""}
                  onChange={(e) => handleFieldChange({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`field-maxlength-${field.id}`} className="text-sm font-medium">Max Length</Label>
                <Input
                  id={`field-maxlength-${field.id}`}
                  type="number"
                  value={field.maxLength || ""}
                  onChange={(e) => handleFieldChange({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="255"
                />
              </div>
            </div>
          )}

          {(field.type === "number" || field.type === "integer") && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor={`field-minimum-${field.id}`} className="text-sm font-medium">Minimum</Label>
                <Input
                  id={`field-minimum-${field.id}`}
                  type="number"
                  value={field.minimum || ""}
                  onChange={(e) => handleFieldChange({ minimum: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`field-maximum-${field.id}`} className="text-sm font-medium">Maximum</Label>
                <Input
                  id={`field-maximum-${field.id}`}
                  type="number"
                  value={field.maximum || ""}
                  onChange={(e) => handleFieldChange({ maximum: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="100"
                />
              </div>
            </div>
          )}

          {field.type === "string" && (
            <div className="space-y-2">
              <Label htmlFor={`field-pattern-${field.id}`} className="text-sm font-medium">Pattern (Regex)</Label>
              <Input
                id={`field-pattern-${field.id}`}
                value={field.pattern || ""}
                onChange={(e) => handleFieldChange({ pattern: e.target.value })}
                placeholder="^[A-Z0-9]+$"
              />
            </div>
          )}

          {(field.type === "date" || field.type === "datetime") && (
            <div className="space-y-2">
              <Label htmlFor={`field-format-${field.id}`} className="text-sm font-medium">Format</Label>
              <Select value={field.format || "date"} onValueChange={(value) => handleFieldChange({ format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (YYYY-MM-DD)</SelectItem>
                  <SelectItem value="date-time">DateTime (ISO-8601)</SelectItem>
                  <SelectItem value="custom">Custom (dd/mm/yyyy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Enum values */}
          {field.type === "enum" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dropdown Options</Label>
              <div className="flex gap-2">
                <Input
                  value={enumInput}
                  onChange={(e) => setEnumInput(e.target.value)}
                  placeholder="Add option..."
                  onKeyPress={(e) => e.key === "Enter" && addEnumValue()}
                />
                <Button type="button" onClick={addEnumValue} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {field.enumValues?.map((value, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {value}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeEnumValue(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default function AddDocumentTypeModal({
  isOpen,
  onClose,
  onAdd,
}: AddDocumentTypeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("📄");
  const [targetTable, setTargetTable] = useState("");
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    fields?: string;
  }>({});

  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Document type name is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (fields.length === 0) {
      newErrors.fields = "At least one field must be added";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addField = (parentId?: string, level = 0) => {
    const newField: SchemaField = {
      id: generateFieldId(),
      name: "",
      displayLabel: "",
      type: "string",
      required: false,
      level,
    };

    if (parentId) {
      // Add as child field (for objects/arrays)
      setFields(prev => prev.map(field => {
        if (field.id === parentId) {
          return {
            ...field,
            objectProperties: [...(field.objectProperties || []), newField]
          };
        }
        return field;
      }));
    } else {
      // Add as root field
      setFields(prev => [...prev, newField]);
    }
  };

  const updateField = (fieldId: string, updates: SchemaField) => {
    setFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        return updates;
      }
      // Handle nested fields
      if (field.objectProperties) {
        return {
          ...field,
          objectProperties: field.objectProperties.map(child => 
            child.id === fieldId ? updates : child
          )
        };
      }
      return field;
    }));
  };

  const deleteField = (fieldId: string) => {
    setFields(prev => prev.filter(field => {
      if (field.id === fieldId) return false;
      // Handle nested fields
      if (field.objectProperties) {
        field.objectProperties = field.objectProperties.filter(child => child.id !== fieldId);
      }
      return true;
    }));
  };



  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Convert fields to the array format expected by handleAddDocumentType
    const requiredFieldsArray = fields.map(field => ({
      name: field.name,
      displayLabel: field.displayLabel || field.name,
      type: field.type === 'textarea' ? 'string' : field.type,
      required: field.required
    }));

    onAdd({
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      targetTable: targetTable.trim() || name.toLowerCase().replace(/\s+/g, '_'),
      requiredFields: requiredFieldsArray,
    });

    // Reset form
    setName("");
    setDescription("");
    setColor("#3B82F6");
    setIcon("📄");
    setTargetTable("");
    setFields([]);
    setErrors({});
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setName("");
    setDescription("");
    setColor("#3B82F6");
    setIcon("📄");
    setTargetTable("");
    setFields([]);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 !translate-x-0 !translate-y-0 !rounded-none !border-0 flex flex-col !gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-white">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Create Advanced Document Type
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Basic Info & Configuration */}
          <div className="w-1/2 border-r bg-gray-50 p-8 overflow-y-auto">
            <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm border space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Basic Information
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Document Type Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Invoice, Purchase Order"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetTable" className="text-sm font-medium">Target Table</Label>
                <Input
                  id="targetTable"
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value)}
                  placeholder="Auto-generated from name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Database table for extracted data
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this document type..."
                className={errors.description ? "border-red-500" : ""}
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-white rounded-lg p-6 shadow-sm border space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
              <Palette className="h-5 w-5 text-blue-600" />
              Color Theme
            </div>
            <div className="grid grid-cols-8 gap-3">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.color}
                  type="button"
                  onClick={() => setColor(option.color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    color === option.color
                      ? "border-gray-900 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: option.color }}
                  title={option.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="bg-white rounded-lg p-6 shadow-sm border space-y-6">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
              <Smile className="h-5 w-5 text-blue-600" />
              Icon Selection
            </div>
            <div className="grid grid-cols-10 gap-4">
              {ICON_OPTIONS.map((option) => (
                <button
                  key={option.icon}
                  type="button"
                  onClick={() => setIcon(option.icon)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center text-lg ${
                    icon === option.icon
                      ? "border-blue-500 bg-blue-50 scale-110"
                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  title={option.name}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>

            </div>
          </div>

          {/* Right Panel - Schema Fields */}
          <div className="flex-1 flex flex-col">
            <div className="p-8 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                  <FileText className="h-5 w-5" />
                  Schema Fields
                </div>
                <Button type="button" onClick={() => addField()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              {errors.fields && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.fields}
                </div>
              )}
            </div>

            <div className="flex-1 p-8 overflow-y-auto bg-white">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">No fields added yet</h3>
                  <p className="text-sm text-muted-foreground">Define the fields that will be extracted from documents of this type. Each field will become a column in the target table.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      onUpdate={(updatedField) => updateField(field.id, updatedField)}
                      onDelete={() => deleteField(field.id)}
                      onAddChild={() => addField(field.id, 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-8 py-6 border-t bg-gray-50 flex-shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Document Type
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}