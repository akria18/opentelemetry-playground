/**
 * Template Selector Component
 * 
 * Dropdown menu for selecting preset OpenTelemetry configurations.
 */

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FileCode, ChevronDown } from 'lucide-react';
import { configTemplates, templateCategories, type ConfigTemplate } from '@/lib/config-templates';

interface TemplateSelectorProps {
  onSelectTemplate: (config: string) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectTemplate = (template: ConfigTemplate) => {
    onSelectTemplate(template.config);
    setIsOpen(false);
  };

  const getTemplatesByCategory = (categoryId: string) => {
    return configTemplates.filter(t => t.category === categoryId);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-card/50 border-border/50 hover:bg-card hover:border-cyan-500/50 text-foreground"
        >
          <FileCode className="h-4 w-4 text-cyan-400" />
          Templates
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-72 bg-card border-border/50"
      >
        <DropdownMenuLabel className="text-muted-foreground font-mono text-xs">
          Configuration Templates
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        
        {templateCategories.map((category) => {
          const templates = getTemplatesByCategory(category.id);
          if (templates.length === 0) return null;
          
          return (
            <DropdownMenuSub key={category.id}>
              <DropdownMenuSubTrigger className="gap-2 cursor-pointer hover:bg-accent">
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {templates.length}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 bg-card border-border/50">
                {templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="flex flex-col items-start gap-1 cursor-pointer hover:bg-accent py-2"
                  >
                    <span className="font-medium text-foreground">
                      {template.name}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
