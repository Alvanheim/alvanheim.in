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
  let currentChapterIndex = -1;
  
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
      
      // Sort chapters in ascending order by number (numerical value)
      const sortedChapters = [...comic.chapters].sort((a, b) => 
        parseFloat(a.number) - parseFloat(b.number)
      );
      
      comicData = {...comic, chapters: sortedChapters};
      
      // Populate the drop-down menu with chapters
      comicData.chapters.forEach((chapter, index) => {
        let option = document.createElement('option');
        option.value = chapter.number;
        option.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
        if (String(chapter.number) === chapterParam) {
          option.selected = true;
          currentChapterIndex = index;
        }
        chapterSelect.appendChild(option);
      });
      
      if (currentChapterIndex === -1) {
        document.querySelector('.container').innerHTML = '<p>Chapter not found</p>';
        return;
      }
      loadChapter();
    })
    .catch(error => {
      console.error('Error fetching comics data:', error);
      document.querySelector('.container').innerHTML = '<p>Error loading chapter details.</p>';
    });

  // Handle drop-down chapter selection change
  chapterSelect.addEventListener('change', function() {
    const selectedChapterNumber = this.value;
    window.location.href = `reader.html?comicId=${comicId}&chapter=${selectedChapterNumber}`;
  });

  function loadChapter() {
    const chapter = comicData.chapters[currentChapterIndex];
    // Set the chapter title
    chapterTitleEl.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
    // Update chapter info display in pagination - use numerical order, not array index
    chapterInfoEl.textContent = `Chapter ${chapter.number} of ${comicData.chapters.length}`;

    // Clear current pages
    pageContainer.innerHTML = '';
    // Display all pages of the chapter
    if (Array.isArray(chapter.pages) && chapter.pages.length) {
      chapter.pages.forEach((pageUrl, index) => {
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
        
        // Replace placeholder with image when loaded
        img.addEventListener('load', () => {
          pageNumberPlaceholder.style.display = 'none';
          img.style.display = 'block';
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
    
    // Update navigation buttons - now properly handling numerical chapter values
    const currentChapterNumber = parseFloat(chapter.number);
    
    // Find previous and next chapters based on numerical values
    const prevChapter = comicData.chapters.find(c => 
      parseFloat(c.number) < currentChapterNumber
    );
    
    const nextChapter = comicData.chapters.filter(c => 
      parseFloat(c.number) > currentChapterNumber
    )[0]; // Get the first chapter with higher number
    
    // Update button visibility
    prevChapterBtn.style.display = prevChapter ? 'block' : 'none';
    nextChapterBtn.style.display = nextChapter ? 'block' : 'none';
    
    // Add data attributes for easy access in event handlers
    if (prevChapter) {
      prevChapterBtn.dataset.chapterNumber = prevChapter.number;
    }
    
    if (nextChapter) {
      nextChapterBtn.dataset.chapterNumber = nextChapter.number;
    }
  }

  // Chapter navigation event listeners
  prevChapterBtn.addEventListener('click', () => {
    if (prevChapterBtn.dataset.chapterNumber) {
      window.location.href = `reader.html?comicId=${comicId}&chapter=${prevChapterBtn.dataset.chapterNumber}`;
    }
  });

  nextChapterBtn.addEventListener('click', () => {
    if (nextChapterBtn.dataset.chapterNumber) {
      window.location.href = `reader.html?comicId=${comicId}&chapter=${nextChapterBtn.dataset.chapterNumber}`;
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
