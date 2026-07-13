import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ListLoaderService {

  constructor() { }
  
   reorderResources(resourceData: any[], selectedGroupResources: any[], sliceSize: number): {
    updatedResourceData: any[],
    visibleResources: any[],
    currentIndex: number
  } {
    const mappedIds = selectedGroupResources.map(item => item.id);
    const mappedResources = resourceData.filter(item => mappedIds.includes(item.id));
    const otherResources = resourceData.filter(item => !mappedIds.includes(item.id));

    const updatedResourceData = [...mappedResources, ...otherResources];
    const visibleResources = updatedResourceData.slice(0, sliceSize);
    const currentIndex = sliceSize;

    return { updatedResourceData, visibleResources, currentIndex };
  }


  loadNextChunk<T>(
    fullData: T[],
    visibleData: T[],
    currentIndex: number,
    chunkSize: number
  ): { updatedVisibleData: T[], newIndex: number } {
    if (currentIndex >= fullData.length) return;
    const nextChunk = fullData.slice(currentIndex, currentIndex + chunkSize);
    const updatedVisibleData = [...visibleData, ...nextChunk];
    
    return {
      updatedVisibleData,
      newIndex: currentIndex + chunkSize
    };
  }
}
