document.addEventListener('DOMContentLoaded', function() {
  // Update current year in footer
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  // Get query parameters: comicId and chapter number
  const params = new URLSearchParams(window.location.search);
  const comicId = params.get('comicId');
  const chapterParam = params.get('chapter'); // chapter number as string

  if (!comicId || !chapterParam) {
    document.querySelector('.container').innerHTML = '<p>Comic ID or chapter number not specified in the URL. Please use ?comicId=1&chapter=1</p>';
    return;
  }

  // Elements
  const chapterTitleEl = document.getElementById('chapter-title');
  const pageContainer = document.getElementById('page-container');
  const chapterInfoEl = document.getElementById('chapterInfo');
  const prevChapterBtn = document.getElementById('prevChapter');
  const nextChapterBtn = document.getElementById('nextChapter');
  const chapterSelect = document.getElementById('chapterSelect');

  let comicData;
  let currentChapter = null;
  
  // Fetch the comics data
  fetch('data/comics.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch comics data');
      }
      return response.json();
    })
    .then(data => {
      // Find the comic by ID
      const comic = data.find(c => c.id === comicId);
      if (!comic) {
        document.querySelector('.container').innerHTML = '<p>Comic not found</p>';
        return;
      }
      
      comicData = comic;
      
      // Find the requested chapter by its number
      currentChapter = comicData.chapters.find(ch => String(ch.number) === chapterParam);
      
      if (!currentChapter) {
        document.querySelector('.container').innerHTML = '<p>Chapter not found</p>';
        return;
      }
      
      // Sort chapters in descending order for proper navigation (newest first)
      comicData.chapters.sort((a, b) => parseFloat(b.number) - parseFloat(a.number));
      
      // Populate the drop-down menu with chapters in descending order
      comicData.chapters.forEach(chapter => {
        let option = document.createElement('option');
        option.value = chapter.number;
        option.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
        if (String(chapter.number) === chapterParam) {
          option.selected = true;
        }
        chapterSelect.appendChild(option);
      });
      
      loadChapter();
    })
    .catch(error => {
      console.error('Error fetching comics data:', error);
      document.querySelector('.container').innerHTML = '<p>Error loading chapter details: ' + error.message + '</p>';
    });

  // Handle drop-down chapter selection change
  chapterSelect.addEventListener('change', function() {
    const selectedChapterNumber = this.value;
    window.location.href = `reader.html?comicId=${comicId}&chapter=${selectedChapterNumber}`;
  });

  function loadChapter() {
    if (!currentChapter) return;
    
    // Set the chapter title
    chapterTitleEl.textContent = `Chapter ${currentChapter.number}: ${currentChapter.title}`;
    
    // Calculate the chapter index (position) in the sorted array
    const totalChapters = comicData.chapters.length;
    const currentIndex = comicData.chapters.findIndex(ch => ch.number === currentChapter.number);
    
    // Update chapter info display in pagination - showing actual position/total
    chapterInfoEl.textContent = `Chapter ${currentChapter.number} (${currentIndex + 1} of ${totalChapters})`;

    // Clear current pages
    pageContainer.innerHTML = '';
    
    // Display all pages of the chapter
    if (Array.isArray(currentChapter.pages) && currentChapter.pages.length) {
      currentChapter.pages.forEach((pageUrl, index) => {
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        
        // Create a page number placeholder
        const pageNumberPlaceholder = document.createElement('div');
        pageNumberPlaceholder.className = 'page-number-placeholder';
        pageNumberPlaceholder.textContent = `Page ${index + 1}`;
        
        // Create the image
        const img = document.createElement('img');
        img.src = pageUrl;
        img.alt = `Page ${index + 1}`;
        img.loading = 'lazy'; // Add lazy loading for better performance
        
        // Replace placeholder with image when loaded
        img.addEventListener('load', () => {
          pageNumberPlaceholder.style.display = 'none';
          img.style.display = 'block';
        });
        
        // Handle image loading error
        img.addEventListener('error', () => {
          pageNumberPlaceholder.textContent = `Error loading page ${index + 1}`;
          pageNumberPlaceholder.style.color = 'red';
        });
        
        // Initially hide the image
        img.style.display = 'none';
        
        pageWrapper.appendChild(pageNumberPlaceholder);
        pageWrapper.appendChild(img);
        pageContainer.appendChild(pageWrapper);
      });
    } else {
      pageContainer.innerHTML = '<p>No pages available for this chapter.</p>';
    }
    
    // Set up navigation buttons based on current index in the sorted array
    updateNavigationButtons(currentIndex);
  }
  
  function updateNavigationButtons(currentIndex) {
    // Previous chapter is the next in the array (since we sorted in descending order)
    const prevChapterIndex = currentIndex + 1;
    const prevChapter = comicData.chapters[prevChapterIndex];
    
    // Next chapter is the previous in the array
    const nextChapterIndex = currentIndex - 1;
    const nextChapter = comicData.chapters[nextChapterIndex];
    
    // Update prev button
    if (prevChapter) {
      prevChapterBtn.style.display = 'block';
      prevChapterBtn.setAttribute('data-chapter', prevChapter.number);
      prevChapterBtn.title = `Go to Chapter ${prevChapter.number}`;
    } else {
      prevChapterBtn.style.display = 'none';
    }
    
    // Update next button
    if (nextChapter) {
      nextChapterBtn.style.display = 'block';
      nextChapterBtn.setAttribute('data-chapter', nextChapter.number);
      nextChapterBtn.title = `Go to Chapter ${nextChapter.number}`;
    } else {
      nextChapterBtn.style.display = 'none';
    }
  }

  // Chapter navigation event listeners
  prevChapterBtn.addEventListener('click', () => {
    const chapterNumber = prevChapterBtn.getAttribute('data-chapter');
    if (chapterNumber) {
      window.location.href = `reader.html?comicId=${comicId}&chapter=${chapterNumber}`;
    }
  });

  nextChapterBtn.addEventListener('click', () => {
    const chapterNumber = nextChapterBtn.getAttribute('data-chapter');
    if (chapterNumber) {
      window.location.href = `reader.html?comicId=${comicId}&chapter=${chapterNumber}`;
    }
  });

  // Keyboard support: arrow keys for chapter navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' && nextChapterBtn.style.display !== 'none') {
      nextChapterBtn.click();
    } else if (e.key === 'ArrowLeft' && prevChapterBtn.style.display !== 'none') {
      prevChapterBtn.click();
    }
  });
  
  // Add swipe navigation for mobile users
  let touchstartX = 0;
  let touchendX = 0;
  
  document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  });
  
  document.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const threshold = 50; // Minimum swipe distance in pixels
    
    if (touchendX + threshold < touchstartX && nextChapterBtn.style.display !== 'none') {
      // Swipe left - go to next chapter
      nextChapterBtn.click();
    } else if (touchendX > touchstartX + threshold && prevChapterBtn.style.display !== 'none') {
      // Swipe right - go to previous chapter
      prevChapterBtn.click();
    }
  }
});
