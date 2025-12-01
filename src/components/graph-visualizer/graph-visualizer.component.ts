import { Component, input, signal, computed, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphNode } from '../../services/json-transform.service';
import mermaid from 'mermaid';

@Component({
  selector: 'app-graph-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full w-full bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      
      <!-- TOOLBAR & VIEW SWITCHER -->
      <div class="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-20">
        
        <!-- Search (Only for Tree View) -->
        <div class="flex items-center gap-4 w-1/3">
          @if (viewMode() === 'tree') {
            <div class="relative w-full max-w-xs group">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="Filter nodes..." 
                (input)="updateSearch($event)"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          }
        </div>

        <!-- View Switcher -->
        <div class="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button 
            (click)="setViewMode('tree')"
            [class.bg-zinc-800]="viewMode() === 'tree'"
            [class.text-cyan-400]="viewMode() === 'tree'"
            [class.text-zinc-500]="viewMode() !== 'tree'"
            class="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all hover:text-zinc-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Tree Inspector
          </button>
          <div class="w-px h-4 bg-zinc-800 mx-1"></div>
          <button 
            (click)="setViewMode('graph')"
            [class.bg-zinc-800]="viewMode() === 'graph'"
            [class.text-purple-400]="viewMode() === 'graph'"
            [class.text-zinc-500]="viewMode() !== 'graph'"
            class="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all hover:text-zinc-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
            Relation Graph
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT AREA -->
      <div class="flex-1 flex overflow-hidden relative">
        
        <!-- TREE VIEW IMPLEMENTATION -->
        @if (viewMode() === 'tree') {
          <!-- LEFT PANEL: TREE EXPLORER -->
          <div class="w-1/3 min-w-[300px] flex flex-col border-r border-zinc-800 h-full bg-[#0c0c0e]">
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
              @if (data()) {
                <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: data() }"></ng-container>
              } @else {
                <div class="flex items-center justify-center h-full text-zinc-600 text-sm">No data</div>
              }
            </div>
          </div>

          <!-- RIGHT PANEL: INSPECTOR -->
          <div class="flex-1 flex flex-col h-full bg-[#09090b] relative overflow-hidden">
            @if (selectedNode(); as node) {
              <!-- Breadcrumbs -->
              <div class="h-10 flex items-center px-4 border-b border-zinc-800 bg-zinc-950/30 overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0">
                <div class="flex items-center text-xs text-zinc-500">
                  @for (step of node.path; track step; let last = $last) {
                    <span class="hover:text-zinc-300 cursor-pointer transition-colors">{{ step }}</span>
                    @if (!last) {
                      <svg class="w-3 h-3 mx-1 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    }
                  }
                </div>
              </div>

              <!-- Inspector Content -->
              <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                <!-- Header Info -->
                <div class="mb-8">
                  <div class="flex items-center gap-3 mb-2">
                    <span [class]="getTypeColor(node.type) + ' px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800'">
                      {{ node.type }}
                    </span>
                    <h2 class="text-2xl font-bold text-zinc-100 tracking-tight">{{ node.key }}</h2>
                  </div>
                  <div class="text-zinc-500 text-sm font-mono flex items-center gap-4">
                    <span>Items: {{ node.children.length + node.content.length }}</span>
                    <span class="text-zinc-700">|</span>
                    <span>ID: {{ node.id }}</span>
                  </div>
                </div>

                <!-- Content Table (Primitives of Current Node) -->
                @if (node.content.length > 0) {
                  <div class="mb-8">
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Properties
                    </h3>
                    <div class="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
                      <table class="w-full text-left text-sm">
                        <thead class="bg-zinc-900 text-zinc-500 border-b border-zinc-800">
                          <tr>
                            <th class="px-4 py-2 font-medium w-1/3">Key</th>
                            <th class="px-4 py-2 font-medium">Value</th>
                            <th class="px-4 py-2 font-medium w-20 text-right">Type</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-800/50">
                          @for (prop of node.content; track prop.key) {
                            <tr class="hover:bg-zinc-800/30 transition-colors group">
                              <td class="px-4 py-2.5 font-mono text-zinc-400">{{ prop.key }}</td>
                              <td class="px-4 py-2.5 font-mono text-zinc-300 break-all select-text">
                                <span [class]="getValueColor(prop.type)">{{ formatValue(prop.value) }}</span>
                              </td>
                              <td class="px-4 py-2.5 text-right text-xs text-zinc-600 group-hover:text-zinc-500">{{ prop.type }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- Children Inline Inspector (Nested Objects/Arrays) -->
                @if (node.children.length > 0) {
                  <div>
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      Nested Structures
                    </h3>
                    
                    <div class="flex flex-col gap-4">
                      @for (child of node.children; track child.id) {
                        <!-- Child Card -->
                        <div class="border border-zinc-800 rounded-lg bg-zinc-900/20 hover:border-zinc-700 transition-colors overflow-hidden">
                          
                          <!-- Child Header -->
                          <div class="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
                            <div class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded flex items-center justify-center border border-zinc-700 bg-zinc-800">
                                    @if (child.type === 'array') {
                                        <span class="text-pink-500 text-[10px] font-bold">[]</span>
                                    } @else {
                                        <span class="text-cyan-500 text-[10px] font-bold">{{ '{}' }}</span>
                                    }
                                </div>
                                <span class="font-mono text-sm font-semibold text-zinc-200">{{ child.key }}</span>
                                <span class="text-xs text-zinc-500">
                                    {{ child.content.length }} props, {{ child.children.length }} nested
                                </span>
                            </div>
                            <button 
                                (click)="selectNode(child)"
                                class="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-cyan-300 px-2 py-1 rounded border border-zinc-700 transition-all flex items-center gap-1">
                                Focus Node 
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                          </div>

                          <!-- Child Content (Inline Primitives) -->
                          @if (child.content.length > 0) {
                            <div class="p-0">
                               <table class="w-full text-left text-xs">
                                    <tbody class="divide-y divide-zinc-800/30">
                                    @for (cProp of child.content; track cProp.key) {
                                        <tr class="hover:bg-zinc-800/30 group/row">
                                            <td class="px-4 py-1.5 font-mono text-zinc-500 w-1/3 border-r border-zinc-800/30">{{ cProp.key }}</td>
                                            <td class="px-4 py-1.5 font-mono text-zinc-400 break-all">
                                                <span [class]="getValueColor(cProp.type)">{{ formatValue(cProp.value) }}</span>
                                            </td>
                                        </tr>
                                    }
                                    </tbody>
                               </table>
                            </div>
                          } @else {
                            <div class="px-4 py-3 text-xs text-zinc-600 italic">
                                No direct properties.
                            </div>
                          }

                          <!-- Child Nested Hint -->
                          @if (child.children.length > 0) {
                              <div class="px-4 py-2 bg-zinc-950/30 border-t border-zinc-800/50 text-xs text-zinc-500 flex items-center gap-2">
                                  <svg class="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                  Contains {{ child.children.length }} nested structure(s): 
                                  <span class="text-zinc-400 font-mono ml-1">
                                      {{ getChildrenKeys(child) }}
                                  </span>
                              </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

              </div>
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center text-zinc-600">
                <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                <p>Select a node to inspect details</p>
              </div>
            }
          </div>
        }

        <!-- GRAPH VIEW IMPLEMENTATION -->
        @if (viewMode() === 'graph') {
           <div class="flex-1 bg-[#121214] relative overflow-hidden cursor-move" 
                (mousedown)="startPan($event)"
                (mousemove)="pan($event)"
                (mouseup)="endPan()"
                (mouseleave)="endPan()"
                (wheel)="handleWheel($event)">
             
             <!-- Zoom Controls -->
             <div class="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
               <!-- Zoom In -->
               <button (click)="adjustZoom(0.2)" class="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg transition-colors" title="Zoom In">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
               </button>
               
               <!-- Reset -->
               <button (click)="resetZoom()" class="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg transition-colors" title="Reset View">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
               </button>

               <!-- Zoom Out -->
               <button (click)="adjustZoom(-0.2)" class="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg transition-colors" title="Zoom Out">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
               </button>
             </div>

             <!-- Mermaid Container -->
             <div class="origin-top-left transition-transform duration-75"
                  [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) scale(' + scale() + ')'">
                <div #mermaidContainer class="flex items-center justify-center p-20 min-w-full min-h-full"></div>
             </div>
           </div>
        }

      </div>

    </div>

    <!-- Recursive Tree Template (Only used in Tree View) -->
    <ng-template #nodeTemplate let-node>
      <div class="select-none">
        <!-- Node Row -->
        <div 
          (click)="selectNode(node)"
          [class.bg-cyan-500_10]="isSelected(node)"
          [class.border-l-2]="isSelected(node)"
          [class.border-cyan-500]="isSelected(node)"
          [class.border-transparent]="!isSelected(node)"
          class="group flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-zinc-900 text-sm transition-colors border-l-2"
          [style.padding-left.px]="(node.path.length - 1) * 12 + 8">
          
          <!-- Expand/Collapse Chevron -->
          <div 
            (click)="toggleExpand($event, node)" 
            class="w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-500 shrink-0 transition-transform duration-200"
            [class.invisible]="node.children.length === 0"
            [class.rotate-90]="node.isExpanded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>

          <!-- Type Icon -->
          @if (node.type === 'array') {
             <svg class="w-4 h-4 text-pink-500/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          } @else if (node.type === 'object') {
             <svg class="w-4 h-4 text-cyan-500/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          }

          <!-- Key Name -->
          <span class="ml-1.5 font-mono truncate" [class.text-cyan-200]="isSelected(node)" [class.text-zinc-400]="!isSelected(node)">
            {{ node.key }}
          </span>
          
          <!-- Count Badge -->
          @if (node.children.length > 0) {
            <span class="ml-auto text-[10px] text-zinc-600 bg-zinc-900 px-1.5 rounded-full min-w-[1.5rem] text-center">
                {{ node.children.length }}
            </span>
          }
        </div>

        <!-- Children -->
        @if (node.isExpanded) {
          <div>
            @for (child of node.children; track child.id) {
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #3f3f46;
    }
    :host ::ng-deep .mermaid .node rect, 
    :host ::ng-deep .mermaid .node circle, 
    :host ::ng-deep .mermaid .node ellipse, 
    :host ::ng-deep .mermaid .node polygon, 
    :host ::ng-deep .mermaid .node path {
       fill: #18181b !important;
       stroke-width: 2px;
    }
    :host ::ng-deep .mermaid .edgePath .path {
       stroke: #52525b !important;
       stroke-width: 2px;
    }
    :host ::ng-deep .mermaid .edgeLabel {
       background-color: #18181b !important;
       color: #a1a1aa !important;
    }
    :host ::ng-deep .mermaid .cluster rect {
        fill: #09090b !important;
        stroke: #27272a !important;
    }
  `]
})
export class GraphVisualizerComponent {
  data = input<GraphNode | null>(null);
  mermaidContainer = viewChild<ElementRef>('mermaidContainer');
  
  selectedNode = signal<GraphNode | null>(null);
  searchTerm = signal<string>('');
  viewMode = signal<'tree' | 'graph'>('tree');
  
  // Pan Zoom State (Signals to avoid NG0100 and support Zoneless)
  panX = signal(0);
  panY = signal(0);
  scale = signal(1);
  
  isDragging = false;
  startX = 0;
  startY = 0;

  constructor() {
    effect(() => {
        const d = this.data();
        if (d && !this.selectedNode()) {
            this.selectedNode.set(d);
        }
    });

    // Render mermaid when view mode changes to graph or data updates
    effect(async () => {
       const mode = this.viewMode();
       const d = this.data();
       const container = this.mermaidContainer();

       if (mode === 'graph' && d && container) {
         // Fix NG0100: Schedule reset for next tick to avoid expression changed error
         setTimeout(() => {
             this.resetZoom();
         }, 0);
         
         // Generate Diagram
         const graphDefinition = this.generateMermaidGraph(d);
         
         // Init mermaid config
         mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'dark', 
            securityLevel: 'loose',
            flowchart: {
                curve: 'basis',
                htmlLabels: true
            }
         });

         try {
             const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), graphDefinition);
             container.nativeElement.innerHTML = svg;
         } catch (e) {
             console.error('Mermaid render error', e);
             container.nativeElement.innerHTML = '<div class="text-red-500">Error rendering graph. Structure might be too complex.</div>';
         }
       }
    });
  }

  setViewMode(mode: 'tree' | 'graph') {
    this.viewMode.set(mode);
  }

  // --- MERMAID GENERATION ---
  generateMermaidGraph(root: GraphNode): string {
    let edges: string[] = [];
    let styles: string[] = [];
    
    // Class Definitions
    const defs = `
    classDef array fill:#fbcfe8,stroke:#ec4899,stroke-width:2px,color:#831843;
    classDef object fill:#cffafe,stroke:#06b6d4,stroke-width:2px,color:#0e7490;
    classDef root fill:#e4e4e7,stroke:#52525b,stroke-width:2px,color:#18181b;
    `;
    
    // Recursive Traversal
    const traverse = (node: GraphNode) => {
        // Only graph Structural Nodes (Object/Array), skip primitives
        if (node.type === 'primitive') return;

        const nodeId = node.id.replace(/-/g, '_'); // Mermaid doesn't like hyphens in IDs sometimes
        
        // Determine styling class
        if (node.type === 'array') styles.push(`class ${nodeId} array;`);
        else if (node.type === 'object') styles.push(`class ${nodeId} object;`);
        else if (node.path.length === 1) styles.push(`class ${nodeId} root;`);

        // Process Children
        node.children.forEach(child => {
            // Filter: Only link to structural children (Objects/Arrays)
            if (child.type === 'primitive') return;

            const childId = child.id.replace(/-/g, '_');
            
            // Sanitize Strings for Mermaid
            // 1. Edge Label (Key): Escape double quotes
            const safeEdgeLabel = child.key.replace(/"/g, '#quot;'); 

            // 2. Node Label: Use Key (Name), not type.
            const safeNodeLabel = `"${child.key.replace(/"/g, '#quot;')}"`;

            // Edge: Parent --> Child
            edges.push(`${nodeId} -- "${safeEdgeLabel}" --> ${childId}[${safeNodeLabel}]`);
            traverse(child);
        });
    };

    // Start
    const rootId = root.id.replace(/-/g, '_');
    traverse(root);

    // Change direction to TD (Vertical)
    let graph = `graph TD\n${defs}\n`;
    
    // If we have edges, show them.
    if (edges.length > 0) {
        graph += edges.join('\n') + '\n';
    } else {
        // Fallback: If root has no structural children, at least show root
        if (root.type !== 'primitive') {
             const safeRootLabel = `"${root.key.replace(/"/g, '#quot;')}"`;
             graph += `${rootId}[${safeRootLabel}]\n`;
        }
    }
    
    // Add styles (deduplicated)
    graph += [...new Set(styles)].join('\n');
    
    return graph;
  }

  // --- PAN ZOOM LOGIC ---
  startPan(e: MouseEvent) {
    this.isDragging = true;
    this.startX = e.clientX - this.panX();
    this.startY = e.clientY - this.panY();
  }

  pan(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.panX.set(e.clientX - this.startX);
    this.panY.set(e.clientY - this.startY);
  }

  endPan() {
    this.isDragging = false;
  }

  handleWheel(e: WheelEvent) {
    e.preventDefault();
    // Scroll down (positive delta) -> Zoom Out
    // Scroll up (negative delta) -> Zoom In
    const zoomFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    this.adjustZoom(direction * zoomFactor);
  }

  adjustZoom(delta: number) {
    const newScale = this.scale() + delta;
    this.scale.set(Math.min(Math.max(0.2, newScale), 5)); // Limits 0.2x to 5x
  }

  resetZoom() {
      this.panX.set(0);
      this.panY.set(0);
      this.scale.set(1);
  }

  // --- TREE VIEW LOGIC (Existing) ---
  selectNode(node: GraphNode) {
    this.selectedNode.set(node);
    if (node.children.length > 0) {
        node.isExpanded = true;
    }
  }

  toggleExpand(event: MouseEvent, node: GraphNode) {
    event.stopPropagation();
    node.isExpanded = !node.isExpanded;
  }

  isSelected(node: GraphNode): boolean {
    return this.selectedNode()?.id === node.id;
  }

  updateSearch(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  getTypeColor(type: string): string {
    switch (type) {
        case 'array': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
        case 'object': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
        default: return 'text-zinc-400 border-zinc-700 bg-zinc-800';
    }
  }

  getValueColor(type: string): string {
    switch (type) {
        case 'string': return 'text-amber-300';
        case 'number': return 'text-emerald-300';
        case 'boolean': return 'text-indigo-400';
        case 'null': return 'text-zinc-500 italic';
        default: return 'text-zinc-300';
    }
  }

  formatValue(val: any): string {
    return String(val);
  }

  getChildrenKeys(node: GraphNode): string {
      return node.children.map(c => c.key).join(', ');
  }
}