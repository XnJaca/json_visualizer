
import { Injectable } from '@angular/core';

export interface GraphNode {
  id: string;
  key: string; 
  path: string[]; // Breadcrumb path
  type: 'object' | 'array' | 'primitive';
  value: any; // Raw value for primitives
  content: { key: string; value: any; type: string }[]; // Primitive properties for Object/Array nodes
  children: GraphNode[]; // Nested objects/arrays
  isExpanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JsonTransformService {
  private idCounter = 0;

  transform(data: any): GraphNode {
    this.idCounter = 0;
    return this.traverse('root', data, []);
  }

  private traverse(key: string, value: any, parentPath: string[]): GraphNode {
    const nodeId = `node-${this.idCounter++}`;
    const currentPath = [...parentPath, key];
    
    const node: GraphNode = {
      id: nodeId,
      key: key,
      path: currentPath,
      type: Array.isArray(value) ? 'array' : (typeof value === 'object' && value !== null ? 'object' : 'primitive'),
      value: value,
      content: [],
      children: [],
      isExpanded: parentPath.length < 2 // Auto-expand only top levels
    };

    if (value === null) {
      node.type = 'primitive';
      node.value = 'null';
      return node;
    }

    if (typeof value === 'object') {
      // Handle Array
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (this.isPrimitive(item)) {
             node.content.push({ key: `${index}`, value: item, type: typeof item });
          } else {
             node.children.push(this.traverse(`${index}`, item, currentPath));
          }
        });
      } 
      // Handle Object
      else {
        Object.entries(value).forEach(([k, v]) => {
          if (this.isPrimitive(v)) {
            node.content.push({ key: k, value: v, type: v === null ? 'null' : typeof v });
          } else {
            node.children.push(this.traverse(k, v, currentPath));
          }
        });
      }
    } else {
      // Primitive Root
      node.content.push({ key: key, value: value, type: typeof value });
    }

    return node;
  }

  private isPrimitive(value: any): boolean {
    return value === null || typeof value !== 'object';
  }

  // Feature: Generate accessible path string (e.g. data.items[0].id)
  static getDotNotation(path: string[]): string {
      if (!path || path.length === 0) return '';
      
      // Remove 'root' from the path display for cleaner copy/paste
      const cleanPath = path[0] === 'root' ? path.slice(1) : path;
      
      return cleanPath.reduce((acc, curr, index) => {
          // Check if current part is an integer (array index)
          const isIndex = /^\d+$/.test(curr);
          
          if (index === 0) return curr;
          
          if (isIndex) {
              return `${acc}[${curr}]`;
          } else {
              // If previous was an index, we need a dot? Usually yes: array[0].prop
              return `${acc}.${curr}`;
          }
      }, '');
  }
}
