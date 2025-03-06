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
  const chapterSelect = document.getElementById('chapterSelect');
  
  // Completely remove pagination container from the DOM if it exists
  const paginationContainer = document.querySelector('.pagination-container');
  if (paginationContainer) {
    paginationContainer.remove();
  }

  // Also remove any existing pagination buttons that might exist independently
  const prevChapterBtn = document.getElementById('prevChapter');
  const nextChapterBtn = document.getElementById('nextChapter');
  
  if (prevChapterBtn) prevChapterBtn.remove();
  if (nextChapterBtn) nextChapterBtn.remove();

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
      
      // Sort chapters by number in descending order (newest first)
      comicData.chapters.sort((a, b) => parseFloat(b.number) - parseFloat(a.number));
      
      // Find the requested chapter by its number
      currentChapter = comicData.chapters.find(ch => String(ch.number) === chapterParam);
      
      if (!currentChapter) {
        document.querySelector('.container').innerHTML = '<p>Chapter not found</p>';
        return;
      }
      
      // Populate the top drop-down menu with chapters
      populateChapterDropdown(chapterSelect, currentChapter.number);
      
      loadChapter();
    })
    .catch(error => {
      console.error('Error fetching comics data:', error);
      document.querySelector('.container').innerHTML = '<p>Error loading chapter details: ' + error.message + '</p>';
    });

  function populateChapterDropdown(selectElement, currentChapterNumber) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Populate with chapters
    comicData.chapters.forEach(chapter => {
      let option = document.createElement('option');
      option.value = chapter.number;
      option.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
      if (String(chapter.number) === String(currentChapterNumber)) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
    
    // Add change event listener
    selectElement.addEventListener('change', function() {
      const selectedChapterNumber = this.value;
      window.location.href = `reader.html?comicId=${comicId}&chapter=${selectedChapterNumber}`;
    });
  }

  function loadChapter() {
    if (!currentChapter) return;
    
    // Set the chapter title
    chapterTitleEl.textContent = `Chapter ${currentChapter.number}: ${currentChapter.title}`;
    
    // Simplified chapter info - just show the chapter number
    chapterInfoEl.textContent = `Chapter ${currentChapter.number}`;

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
        img.loading = 'lazy';
        
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
      
      // Add end-of-chapter dropdown for navigation instead of pagination buttons
      const endChapterNav = document.createElement('div');
      endChapterNav.className = 'end-chapter-navigation';
      
      // Create styled container
      const navContainer = document.createElement('div');
      navContainer.className = 'chapter-navigation-container';
      
      // Add heading
      const navHeading = document.createElement('h3');
      navHeading.textContent = 'Continue Reading';
      navHeading.className = 'navigation-heading';
      
      // Create bottom dropdown
      const bottomSelect = document.createElement('select');
      bottomSelect.className = 'chapter-select-bottom';
      populateChapterDropdown(bottomSelect, currentChapter.number);
      
      // Assemble elements
      navContainer.appendChild(navHeading);
      navContainer.appendChild(bottomSelect);
      endChapterNav.appendChild(navContainer);
      
      // Add to page
      pageContainer.appendChild(endChapterNav);
      
      // Add CSS for the new elements
      addEndChapterStyles();
      
    } else {
      pageContainer.innerHTML = '<p>No pages available for this chapter.</p>';
    }
  }
  
  function addEndChapterStyles() {
    // Check if styles already exist
    if (document.getElementById('end-chapter-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'end-chapter-styles';
    styleEl.textContent = `
      /* Hide any pagination that might be added dynamically */
      .pagination-container, 
      #prevChapter, 
      #nextChapter, 
      [id*="pagination"], 
      [class*="pagination"], 
      [class*="pager"], 
      [id*="pager"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      .end-chapter-navigation {
        width: 100%;
        margin: 30px 0;
        display: flex;
        justify-content: center;
      }
      
      .chapter-navigation-container {
        background-color: #f5f5f5;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        width: 80%;
        max-width: 500px;
        text-align: center;
      }
      
      .navigation-heading {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
        font-size: 18px;
      }
      
      .chapter-select-bottom {
        width: 100%;
        padding: 10px 15px;
        font-size: 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: white;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 10px center;
        background-size: 15px;
      }
      
      .chapter-select-bottom:focus {
        outline: none;
        border-color: #666;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
      }
      
      /* Page wrapper and image styles */
      .page-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 15px;
      }
      
      .page-wrapper img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
      
      .page-number-placeholder {
        width: 100%;
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f9f9f9;
        border: 1px solid #eee;
        border-radius: 4px;
        color: #999;
        font-size: 18px;
      }
    `;
    
    document.head.appendChild(styleEl);
  }

  // Remove keyboard navigation to avoid recreating pagination effect
  document.removeEventListener('keydown', keyboardNavHandler);
});

// Define the function we're removing to avoid errors
function keyboardNavHandler() {}
