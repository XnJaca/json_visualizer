
import { Component, input, output, signal, computed, effect, ElementRef, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphNode, JsonTransformService } from '../../services/json-transform.service';
import { ThemeService } from '../../services/theme.service';
import mermaid from 'mermaid';

@Component({
  selector: 'app-graph-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-300 font-sans overflow-hidden transition-colors duration-300">
      
      <!-- TOOLBAR & VIEW SWITCHER -->
      <div class="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-20 transition-colors duration-300">
        
        <!-- Search (Both Views) - Feature 4 -->
        <div class="flex items-center gap-4 w-1/3">
          <div class="relative w-full max-w-xs group">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              [placeholder]="viewMode() === 'tree' ? 'Filter nodes...' : 'Search in graph...'" 
              (input)="updateSearch($event)"
              (keydown.enter)="performGraphSearch()"
              class="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-1 pl-8 pr-3 text-xs text-zinc-800 dark:text-zinc-300 placeholder-zinc-500 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
        </div>

        <!-- View Switcher -->
        <div class="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
          <button 
            (click)="setViewMode('tree')"
            [class.bg-white]="viewMode() === 'tree'"
            [class.dark:bg-zinc-800]="viewMode() === 'tree'"
            [class.shadow-sm]="viewMode() === 'tree'"
            [class.text-cyan-600]="viewMode() === 'tree'"
            [class.dark:text-cyan-400]="viewMode() === 'tree'"
            [class.text-zinc-500]="viewMode() !== 'tree'"
            class="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all hover:text-zinc-700 dark:hover:text-zinc-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Tree Inspector
          </button>
          <div class="w-px h-4 bg-zinc-300 dark:bg-zinc-800 mx-1"></div>
          <button 
            (click)="setViewMode('graph')"
             [class.bg-white]="viewMode() === 'graph'"
            [class.dark:bg-zinc-800]="viewMode() === 'graph'"
            [class.shadow-sm]="viewMode() === 'graph'"
            [class.text-purple-600]="viewMode() === 'graph'"
            [class.dark:text-purple-400]="viewMode() === 'graph'"
            [class.text-zinc-500]="viewMode() !== 'graph'"
            class="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all hover:text-zinc-700 dark:hover:text-zinc-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
            Relation Graph
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT AREA -->
      <div class="flex-1 flex overflow-hidden relative">
        
        <!-- TREE VIEW IMPLEMENTATION -->
        <div class="w-1/3 min-w-[300px] flex flex-col border-r border-zinc-200 dark:border-zinc-800 h-full bg-zinc-50 dark:bg-[#0c0c0e] transition-colors duration-300"
             [class.hidden]="viewMode() === 'graph'">
          <div class="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
            @if (data()) {
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: data() }"></ng-container>
            } @else {
              <div class="flex items-center justify-center h-full text-zinc-500 text-sm">No data</div>
            }
          </div>
        </div>
        
        <!-- RIGHT PANEL: INSPECTOR (Tree Mode) -->
        <div class="flex-1 flex flex-col h-full bg-white dark:bg-[#09090b] relative overflow-hidden transition-colors duration-300"
             [class.hidden]="viewMode() === 'graph'">
             <ng-container *ngTemplateOutlet="inspectorTemplate"></ng-container>
        </div>

        <!-- GRAPH VIEW IMPLEMENTATION -->
        <div class="absolute inset-0 z-0 bg-zinc-100 dark:bg-[#121214] overflow-hidden cursor-move transition-colors duration-300" 
             [class.visibility-hidden]="viewMode() !== 'graph'"
             (mousedown)="startPan($event)"
             (mousemove)="pan($event)"
             (mouseup)="endPan()"
             (mouseleave)="endPan()"
             (wheel)="handleWheel($event)">
             
             <!-- Zoom Controls & Download -->
             <div class="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
               <!-- Feature 2: Download SVG -->
               <button (click)="downloadSvg()" class="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-lg transition-colors" title="Download SVG">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               </button>

               <div class="w-full h-px bg-zinc-300 dark:bg-zinc-700 my-1"></div>

               <!-- Zoom In -->
               <button (click)="adjustZoom(0.2)" class="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-lg transition-colors" title="Zoom In">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
               </button>
               
               <!-- Reset -->
               <button (click)="resetZoom()" class="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-lg transition-colors" title="Reset View">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
               </button>

               <!-- Zoom Out -->
               <button (click)="adjustZoom(-0.2)" class="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-lg transition-colors" title="Zoom Out">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
               </button>
             </div>

             <!-- Mermaid Container -->
             <div class="origin-top-left transition-transform duration-75"
                  [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) scale(' + scale() + ')'">
                <div #mermaidContainer class="flex items-center justify-center p-20 min-w-full min-h-full pointer-events-none [&_svg]:pointer-events-auto"></div>
             </div>
        </div>

        <!-- Graph Mode Inspector Drawer (Draggable & Minimizable) -->
        @if (viewMode() === 'graph' && selectedNode()) {
            <div class="absolute w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl z-20 flex flex-col overflow-hidden animate-in fade-in duration-200"
                 [style.transform]="'translate(' + inspectorTransform().x + 'px, ' + inspectorTransform().y + 'px)'"
                 [style.height]="isInspectorMinimized() ? 'auto' : 'auto'"
                 style="top: 16px; right: 16px;">
                 
                <!-- Header (Draggable Handle) -->
                <div (mousedown)="startDragInspector($event)" 
                     class="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 cursor-move select-none">
                    <span class="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                        Node Inspector
                    </span>
                    <div class="flex items-center gap-1">
                        <!-- Minimize Button -->
                        <button (click)="toggleInspectorMinimize($event)" class="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                            @if (isInspectorMinimized()) {
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                            } @else {
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                            }
                        </button>
                        <!-- Close Button -->
                        <button (click)="closeInspector($event)" class="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div [class.hidden]="isInspectorMinimized()" class="flex-1 overflow-hidden relative" style="max-height: 80vh;">
                    <ng-container *ngTemplateOutlet="inspectorTemplate"></ng-container>
                </div>
            </div>
        }

      </div>

    </div>

    <!-- Inspector Template (Used in both views) -->
    <ng-template #inspectorTemplate>
        @if (selectedNode(); as node) {
              <!-- Breadcrumbs -->
              <div class="h-10 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0 transition-colors duration-300">
                <div class="flex items-center text-xs text-zinc-500">
                  @for (step of node.path; track step; let last = $last) {
                    <span class="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">{{ step }}</span>
                    @if (!last) {
                      <svg class="w-3 h-3 mx-1 text-zinc-400 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    }
                  }
                </div>
              </div>

              <!-- Inspector Content -->
              <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                <!-- Header Info -->
                <div class="mb-6">
                  <div class="flex items-center gap-3 mb-2">
                    <span [class]="getTypeColor(node.type) + ' px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors'">
                      {{ node.type }}
                    </span>
                    <h2 class="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight transition-colors truncate">{{ node.key }}</h2>
                  </div>
                  <div class="text-zinc-500 text-sm font-mono flex items-center gap-4">
                    <span>Items: {{ node.children.length + node.content.length }}</span>
                    <span class="text-zinc-300 dark:text-zinc-700">|</span>
                    <!-- Feature 3: Copy Path for Node -->
                    <button 
                        (click)="copyPath(node.path)" 
                        class="flex items-center gap-1 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                        title="Copy full path">
                        <span>ID: {{ node.id }}</span>
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    </button>
                  </div>
                </div>

                <!-- Content Table (Primitives of Current Node) -->
                @if (node.content.length > 0) {
                  <div class="mb-6">
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Properties
                    </h3>
                    <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors">
                      <table class="w-full text-left text-sm">
                        <thead class="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
                          <tr>
                            <th class="px-4 py-2 font-medium w-1/3 text-xs">Key</th>
                            <th class="px-4 py-2 font-medium text-xs">Value</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                          @for (prop of node.content; track prop.key) {
                            <tr class="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors group">
                              <td class="px-4 py-2 font-mono text-zinc-600 dark:text-zinc-400 text-xs flex items-center justify-between">
                                  {{ prop.key }}
                                  <!-- Copy Path for Property -->
                                  <button 
                                    (click)="copyPath(node.path, prop.key)" 
                                    class="text-zinc-300 dark:text-zinc-700 hover:text-cyan-600 dark:hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Copy Path">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                  </button>
                              </td>
                              <td class="px-4 py-2 font-mono text-zinc-800 dark:text-zinc-300 break-all select-text text-xs">
                                <span [class]="getValueColor(prop.type)">{{ formatValue(prop.value) }}</span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- Children Inline Inspector -->
                @if (node.children.length > 0) {
                  <div>
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      Nested Structures
                    </h3>
                    
                    <div class="flex flex-col gap-3">
                      @for (child of node.children; track child.id) {
                        <!-- Child Card -->
                        <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/20 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors overflow-hidden">
                          
                          <!-- Child Header -->
                          <div class="flex items-center justify-between px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 rounded flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                                    @if (child.type === 'array') {
                                        <span class="text-pink-500 text-[9px] font-bold">[]</span>
                                    } @else {
                                        <span class="text-cyan-500 text-[9px] font-bold">{{ '{}' }}</span>
                                    }
                                </div>
                                <span class="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200">{{ child.key }}</span>
                            </div>
                            <button 
                                (click)="selectNode(child)"
                                class="text-[10px] bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 transition-all flex items-center gap-1">
                                Focus
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                          </div>

                          <!-- Child Content (Inline Primitives) -->
                          @if (child.content.length > 0) {
                            <div class="p-0">
                               <table class="w-full text-left text-[10px]">
                                    <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/30">
                                    @for (cProp of child.content; track cProp.key) {
                                        <tr class="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 group/row transition-colors">
                                            <td class="px-3 py-1 font-mono text-zinc-500 dark:text-zinc-500 w-1/3 border-r border-zinc-100 dark:border-zinc-800/30 flex justify-between">
                                                {{ cProp.key }}
                                                <button (click)="copyPath(child.path, cProp.key)" class="text-zinc-300 dark:text-zinc-700 hover:text-cyan-600 dark:hover:text-cyan-400 opacity-0 group-hover/row:opacity-100 transition-all">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                                </button>
                                            </td>
                                            <td class="px-3 py-1 font-mono text-zinc-700 dark:text-zinc-400 break-all">
                                                <span [class]="getValueColor(cProp.type)">{{ formatValue(cProp.value) }}</span>
                                            </td>
                                        </tr>
                                    }
                                    </tbody>
                               </table>
                            </div>
                          } 

                          <!-- Child Nested Hint -->
                          @if (child.children.length > 0) {
                              <div class="px-3 py-1.5 bg-zinc-100/50 dark:bg-zinc-950/30 border-t border-zinc-200 dark:border-zinc-800/50 text-[10px] text-zinc-500 flex items-center gap-2">
                                  <svg class="w-3 h-3 text-zinc-400 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                  Contains {{ child.children.length }} nested structure(s)
                              </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

              </div>
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 transition-colors">
                <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                <p>Select a node to inspect details</p>
              </div>
            }
    </ng-template>

    <!-- Recursive Tree Template (Only used in Tree View) -->
    <ng-template #nodeTemplate let-node>
      <div class="select-none">
        <!-- Node Row -->
        <div 
          (click)="selectNode(node)"
          [class.bg-cyan-50]="isSelected(node)"
          [class.dark:bg-cyan-900/20]="isSelected(node)"
          [class.border-l-2]="isSelected(node)"
          [class.border-cyan-500]="isSelected(node)"
          [class.dark:border-cyan-700]="isSelected(node)"
          [class.border-transparent]="!isSelected(node)"
          class="group flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm transition-colors border-l-2"
          [style.padding-left.px]="(node.path.length - 1) * 12 + 8">
          
          <!-- Expand/Collapse Chevron -->
          <div 
            (click)="toggleExpand($event, node)" 
            class="w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-200"
            [class.invisible]="node.children.length === 0"
            [class.rotate-90]="node.isExpanded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>

          <!-- Type Icon -->
          @if (node.type === 'array') {
             <svg class="w-4 h-4 text-pink-500/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          } @else if (node.type === 'object') {
             <svg class="w-4 h-4 text-cyan-600/80 dark:text-cyan-500/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          }

          <!-- Key Name -->
          <span class="ml-1.5 font-mono truncate transition-colors" [class.text-cyan-700]="isSelected(node)" [class.dark:text-cyan-300]="isSelected(node)" [class.text-zinc-700]="!isSelected(node)" [class.dark:text-zinc-400]="!isSelected(node)">
            {{ node.key }}
          </span>
          
          <!-- Count Badge -->
          @if (node.children.length > 0) {
            <span class="ml-auto text-[10px] text-zinc-500 dark:text-zinc-600 bg-zinc-200 dark:bg-zinc-900 px-1.5 rounded-full min-w-[1.5rem] text-center transition-colors">
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
      background: #e4e4e7;
      border-radius: 3px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #27272a;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #d4d4d8;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #3f3f46;
    }
    .visibility-hidden {
        visibility: hidden;
        pointer-events: none;
    }

    /* Highlight Search in Graph */
    :host ::ng-deep .mermaid .node.search-match rect,
    :host ::ng-deep .mermaid .node.search-match circle,
    :host ::ng-deep .mermaid .node.search-match polygon {
        stroke: #f59e0b !important; /* Amber-500 */
        stroke-width: 4px !important;
        filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
        transition: all 0.3s ease;
    }

    /* Interactive Graph Nodes */
    :host ::ng-deep .mermaid .node {
        cursor: pointer !important;
    }
    :host ::ng-deep .mermaid .node:hover rect,
    :host ::ng-deep .mermaid .node:hover circle,
    :host ::ng-deep .mermaid .node:hover polygon {
        filter: brightness(0.9);
        transition: filter 0.2s;
    }

    /* Dark Mode Mermaid Styles */
    :host-context(.dark) ::ng-deep .mermaid .node rect, 
    :host-context(.dark) ::ng-deep .mermaid .node circle, 
    :host-context(.dark) ::ng-deep .mermaid .node ellipse, 
    :host-context(.dark) ::ng-deep .mermaid .node polygon, 
    :host-context(.dark) ::ng-deep .mermaid .node path {
       fill: #18181b !important;
       stroke-width: 2px;
    }
    :host-context(.dark) ::ng-deep .mermaid .edgePath .path {
       stroke: #52525b !important;
       stroke-width: 2px;
    }
    :host-context(.dark) ::ng-deep .mermaid .edgeLabel {
       background-color: #18181b !important;
       color: #a1a1aa !important;
    }
    :host-context(.dark) ::ng-deep .mermaid .cluster rect {
        fill: #09090b !important;
        stroke: #27272a !important;
    }

    /* Light Mode Mermaid Styles */
    :host ::ng-deep .mermaid .node rect, 
    :host ::ng-deep .mermaid .node circle, 
    :host ::ng-deep .mermaid .node ellipse, 
    :host ::ng-deep .mermaid .node polygon, 
    :host ::ng-deep .mermaid .node path {
       fill: #ffffff !important;
       stroke-width: 2px;
    }
    :host ::ng-deep .mermaid .edgePath .path {
       stroke: #a1a1aa !important;
       stroke-width: 2px;
    }
    :host ::ng-deep .mermaid .edgeLabel {
       background-color: #ffffff !important;
       color: #52525b !important;
    }
  `]
})
export class GraphVisualizerComponent {
  data = input<GraphNode | null>(null);
  nodeSelected = output<GraphNode>(); // Output for external sync

  mermaidContainer = viewChild<ElementRef>('mermaidContainer');
  themeService = inject(ThemeService);
  
  selectedNode = signal<GraphNode | null>(null);
  searchTerm = signal<string>('');
  viewMode = signal<'tree' | 'graph'>('tree');
  
  // Pan Zoom State (Signals)
  panX = signal(0);
  panY = signal(0);
  scale = signal(1);
  
  isDragging = false;
  startX = 0;
  startY = 0;

  // Inspector Moveable State
  inspectorTransform = signal({ x: 0, y: 0 });
  isInspectorMinimized = signal(false);
  private isDraggingInspector = false;
  private inspectorDragStart = { x: 0, y: 0 };
  private inspectorStartTransform = { x: 0, y: 0 };

  constructor() {
    effect(() => {
        const d = this.data();
        if (d && !this.selectedNode()) {
            this.selectedNode.set(d);
        }
    });

    // Render mermaid
    effect(async () => {
       const mode = this.viewMode();
       const d = this.data();
       const container = this.mermaidContainer();
       const currentTheme = this.themeService.mode();

       if (mode === 'graph' && d && container) {
         // Generate Diagram
         const graphDefinition = this.generateMermaidGraph(d);
         
         const mermaidTheme = currentTheme === 'dark' ? 'dark' : 'base';
         
         mermaid.initialize({ 
            startOnLoad: false, 
            theme: mermaidTheme, 
            securityLevel: 'loose', // Allows clicks? No, mostly script tags.
            flowchart: {
                curve: 'basis',
                htmlLabels: true
            },
            themeVariables: currentTheme === 'light' ? {
                primaryColor: '#fafafa',
                primaryTextColor: '#27272a',
                primaryBorderColor: '#d4d4d8',
                lineColor: '#a1a1aa',
            } : undefined
         });

         try {
             const { svg, bindFunctions } = await mermaid.render('mermaid-svg-' + Date.now(), graphDefinition);
             container.nativeElement.innerHTML = svg;
             if (bindFunctions) bindFunctions(container.nativeElement);
             
             // FEATURE 1: Add click listeners manually to nodes
             this.attachClickListeners(container.nativeElement);
             
         } catch (e) {
             console.error('Mermaid render error', e);
             container.nativeElement.innerHTML = '<div class="text-red-500">Error rendering graph. Structure might be too complex.</div>';
         }
       }
    });
  }

  // --- INSPECTOR DRAG LOGIC ---
  startDragInspector(e: MouseEvent) {
      e.preventDefault();
      // Only drag if not clicking buttons
      if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
          return;
      }
      
      this.isDraggingInspector = true;
      this.inspectorDragStart = { x: e.clientX, y: e.clientY };
      this.inspectorStartTransform = { ...this.inspectorTransform() };
      
      // Bind global events
      document.addEventListener('mousemove', this.onDragInspector);
      document.addEventListener('mouseup', this.stopDragInspector);
  }

  onDragInspector = (e: MouseEvent) => {
      if (!this.isDraggingInspector) return;
      const dx = e.clientX - this.inspectorDragStart.x;
      const dy = e.clientY - this.inspectorDragStart.y;
      
      this.inspectorTransform.set({
          x: this.inspectorStartTransform.x + dx,
          y: this.inspectorStartTransform.y + dy
      });
  }

  stopDragInspector = () => {
      this.isDraggingInspector = false;
      document.removeEventListener('mousemove', this.onDragInspector);
      document.removeEventListener('mouseup', this.stopDragInspector);
  }

  toggleInspectorMinimize(event: MouseEvent) {
    event.stopPropagation();
    this.isInspectorMinimized.update(v => !v);
  }

  closeInspector(event: MouseEvent) {
    event.stopPropagation();
    this.selectedNode.set(null);
  }

  // --- FEATURE 1: Interactive Graph Logic ---
  attachClickListeners(svgElement: HTMLElement) {
      const nodes = svgElement.querySelectorAll('.node');
      nodes.forEach((node) => {
          node.addEventListener('click', (e) => {
              // Extract ID from the DOM element ID (flowchart-node_X-...)
              // The id attribute usually looks like "flowchart-node_123-..."
              const domId = node.id; 
              // We need the part between "flowchart-" and the next dash maybe?
              // Actually, in generateMermaidGraph, we used node.id (which is "node-X") replaced by underscores ("node_X")
              
              // Let's try to match the ID from our data.
              // Helper: map dom ID back to our node ID
              // Our node ID: node-1
              // Mermaid node ID: node_1
              
              // Find the 'key' part inside the mermaid ID
              // The mermaid ID format is roughly "flowchart-{nodeId}-{somehash}"
              
              // Better strategy: Store a lookup map or traverse to find matching ID.
              // Since we don't have a map, let's reverse the ID transformation.
              // Mermaid renders id="{id}" for the group. 
              
              // Let's parse the ID from the node element's ID.
              // Example: flowchart-node_0-23423423
              const parts = domId.split('-');
              if (parts.length >= 2) {
                  // parts[1] is likely "node_0"
                  const nodeId = parts[1].replace(/_/g, '-');
                  
                  // Find this node in our data
                  const findNode = (root: GraphNode): GraphNode | null => {
                      if (root.id === nodeId) return root;
                      for (const child of root.children) {
                          const found = findNode(child);
                          if (found) return found;
                      }
                      return null;
                  };

                  const d = this.data();
                  if (d) {
                      const target = findNode(d);
                      if (target) {
                          this.selectNode(target);
                          // Stop propagation
                          e.stopPropagation();
                      }
                  }
              }
          });
      });
  }

  setViewMode(mode: 'tree' | 'graph') {
    this.viewMode.set(mode);
    // Reset zoom when switching to graph? Maybe not.
  }

  // --- FEATURE 4: GRAPH SEARCH ---
  performGraphSearch() {
      const term = this.searchTerm().toLowerCase();
      if (!term || this.viewMode() !== 'graph') return;
      
      const container = this.mermaidContainer()?.nativeElement;
      if (!container) return;

      // 1. Find node in data that matches
      const findNode = (node: GraphNode): GraphNode | null => {
          if (node.key.toLowerCase().includes(term)) return node;
          for (const child of node.children) {
              const found = findNode(child);
              if (found) return found;
          }
          return null;
      };

      const d = this.data();
      if (!d) return;
      const targetNode = findNode(d);

      if (targetNode) {
          // 2. Find SVG element
          const mermaidId = targetNode.id.replace(/-/g, '_');
          const element = container.querySelector(`[id^="flowchart-${mermaidId}-"]`);
          
          if (element && element instanceof SVGGraphicsElement) {
              // 3. Highlight
              container.querySelectorAll('.search-match').forEach((el: Element) => el.classList.remove('search-match'));
              element.classList.add('search-match');

              // 4. Center View (Pan & Zoom)
              const bbox = element.getBBox();
              const containerRect = container.parentElement?.getBoundingClientRect(); 
              
              if (containerRect) {
                 const nodeCenterX = bbox.x + bbox.width / 2;
                 const nodeCenterY = bbox.y + bbox.height / 2;
                 
                 const targetScale = 1.5; 
                 this.scale.set(targetScale);
                 
                 const wrapperW = containerRect.width;
                 const wrapperH = containerRect.height;
                 
                 const newPanX = (wrapperW / 2) - (nodeCenterX * targetScale);
                 const newPanY = (wrapperH / 2) - (nodeCenterY * targetScale);
                 
                 this.panX.set(newPanX);
                 this.panY.set(newPanY);
              }
              
              // Also select it
              this.selectNode(targetNode);
          }
      }
  }

  // --- FEATURE 3: COPY PATH ---
  copyPath(path: string[], specificKey?: string) {
      const fullPath = specificKey ? [...path, specificKey] : path;
      const dotNotation = JsonTransformService.getDotNotation(fullPath);
      navigator.clipboard.writeText(dotNotation).then(() => {
          console.log('Copied:', dotNotation);
      });
  }

  // --- FEATURE 2: DOWNLOAD SVG ---
  downloadSvg() {
      const container = this.mermaidContainer()?.nativeElement;
      if (!container) return;
      
      const svgElement = container.querySelector('svg');
      if (!svgElement) return;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'graph_diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }

  // --- MERMAID GENERATION ---
  generateMermaidGraph(root: GraphNode): string {
    let edges: string[] = [];
    let styles: string[] = [];
    
    // Theme-aware colors
    const isDark = this.themeService.mode() === 'dark';
    
    const arrayFill = isDark ? '#18181b' : '#ffffff'; 
    const arrayStroke = isDark ? '#f472b6' : '#db2777'; 
    const arrayColor = isDark ? '#e4e4e7' : '#831843';
    
    const objFill = isDark ? '#18181b' : '#ffffff'; 
    const objStroke = isDark ? '#22d3ee' : '#0891b2'; 
    const objColor = isDark ? '#e4e4e7' : '#155e75';

    const rootFill = isDark ? '#18181b' : '#ffffff';
    const rootStroke = isDark ? '#a1a1aa' : '#52525b';
    const rootColor = isDark ? '#e4e4e7' : '#18181b';

    const defs = `
    classDef array fill:${arrayFill},stroke:${arrayStroke},stroke-width:2px,color:${arrayColor};
    classDef object fill:${objFill},stroke:${objStroke},stroke-width:2px,color:${objColor};
    classDef root fill:${rootFill},stroke:${rootStroke},stroke-width:2px,color:${rootColor};
    `;
    
    const traverse = (node: GraphNode) => {
        if (node.type === 'primitive') return;

        const nodeId = node.id.replace(/-/g, '_'); 
        
        if (node.type === 'array') styles.push(`class ${nodeId} array;`);
        else if (node.type === 'object') styles.push(`class ${nodeId} object;`);
        else if (node.path.length === 1) styles.push(`class ${nodeId} root;`);

        node.children.forEach(child => {
            if (child.type === 'primitive') return;

            const childId = child.id.replace(/-/g, '_');
            const safeEdgeLabel = child.key.replace(/"/g, '#quot;'); 
            const safeNodeLabel = `"${child.key.replace(/"/g, '#quot;')}"`;

            edges.push(`${nodeId} -- "${safeEdgeLabel}" --> ${childId}[${safeNodeLabel}]`);
            traverse(child);
        });
    };

    const rootId = root.id.replace(/-/g, '_');
    traverse(root);

    let graph = `graph TD\n${defs}\n`;
    
    if (edges.length > 0) {
        graph += edges.join('\n') + '\n';
    } else {
        if (root.type !== 'primitive') {
             const safeRootLabel = `"${root.key.replace(/"/g, '#quot;')}"`;
             graph += `${rootId}[${safeRootLabel}]\n`;
        }
    }
    
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
    const zoomFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    this.adjustZoom(direction * zoomFactor);
  }

  adjustZoom(delta: number) {
    const newScale = this.scale() + delta;
    this.scale.set(Math.min(Math.max(0.2, newScale), 5)); 
  }

  resetZoom() {
      // Use setTimeout to avoid NG0100: ExpressionChangedAfterItHasBeenCheckedError
      // because this updates signals that affect style bindings potentially during a change detection cycle
      setTimeout(() => {
          this.panX.set(0);
          this.panY.set(0);
          this.scale.set(1);
      });
  }

  // --- TREE VIEW LOGIC ---
  selectNode(node: GraphNode) {
    this.selectedNode.set(node);
    this.nodeSelected.emit(node);
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
        case 'array': return 'text-pink-600 dark:text-pink-400 border-pink-500/30 bg-pink-500/10';
        case 'object': return 'text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
        default: return 'text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800';
    }
  }

  getValueColor(type: string): string {
    switch (type) {
        case 'string': return 'text-amber-600 dark:text-amber-300';
        case 'number': return 'text-emerald-600 dark:text-emerald-300';
        case 'boolean': return 'text-indigo-600 dark:text-indigo-400';
        case 'null': return 'text-zinc-400 dark:text-zinc-500 italic';
        default: return 'text-zinc-700 dark:text-zinc-300';
    }
  }

  formatValue(val: any): string {
    return String(val);
  }

  getChildrenKeys(node: GraphNode): string {
      return node.children.map(c => c.key).join(', ');
  }
}
