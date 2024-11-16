let menuData = {
  menu: [], active: true
};
let cart = [];  // Cart array to hold items
let selected = undefined;
let user = JSON.parse(localStorage.getItem("user"));
let token = JSON.parse(localStorage.getItem("token"));
let urpl = JSON.parse(localStorage.getItem("uprl"));
let section = 'menu'
let thumbnailBase64;
function loadMenu(resturanId) {
  user = JSON.parse(localStorage.getItem("user"));
  token = JSON.parse(localStorage.getItem("token"))
  if (!user || !user.role || user.role !== 'Admin' || !user.resturant_id || !token) {
    window.location.href = "./login.html"
  }

  let cleanedStr = user.resturant_id.replace(/'/g, "");  // Removes all single quotes

  if (user.resturant_id) {
    const cldUrl = `https://pub-fbdbb25b0f934dd8b443b70f85c547a0.r2.dev/${cleanedStr}.json`
    // Fetch the file from S3
    fetch(cldUrl)
      .then(response => {
        if (!response.ok) {
          if (response.statusText === 'Not Found') {
            // menuData = [];
            throw new Error("No objects");

          }
          else {
            throw new Error('Network response was not ok ' + response.statusText);
          }
        }
        return response.json();  // Use response.json() if it’s a JSON file
      })
      .then(data => {
        menuData = data
        createMenu(menuData);
      })
      .catch(error => {
        console.log('There was a problem with the fetch operation:', error);
      });

  }

}

function createMenu(menuData) {
  if (menuData?.active) {
    // menuData = data.menu;
    const menuSection = document.getElementById("menu-section");
    const categoryNav = document.querySelector('.category-nav');
    menuSection.innerHTML = "";
    categoryNav.innerHTML = "";
    categoryNav.style.overflowX = "auto"; // Ensure horizontal scrolling is enabled
    categoryNav.style.whiteSpace = "nowrap"; // Prevent wrapping, allowing the categories to be on a single line

    menuData.menu.forEach((category, index) => {
      const categoryId = category.category.toLowerCase().replace(/\s+/g, '-');

      // Create category link
      const categoryLink = document.createElement("a");
      categoryLink.href = `#${categoryId}`;
      categoryLink.innerText = category.category;
      categoryLink.classList.add('category-link');
      categoryLink.style.display = "inline-block"; // Make sure links are inline for horizontal scrolling
      categoryLink.addEventListener('click', (e) => navLinkClick(categoryId, e))
      if (index == 0) {
        categoryLink.classList.add('active-link')
      }
      categoryNav.appendChild(categoryLink);
      categoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.category-link').forEach(link => link.classList.remove('active-link'));
        categoryLink.classList.add('active-link');

        const categoryHeader = document.getElementById(categoryId);
        const offset = categoryNav.offsetHeight;

        window.scrollTo({
          top: categoryHeader.offsetTop - offset,
          behavior: 'smooth'
        });
      });

      const categoryHeader = document.createElement("h2");
      categoryHeader.innerText = category.category;
      categoryHeader.id = categoryId;
      menuSection.appendChild(categoryHeader);
      //  <img class="menu-image" src="data:image/jpeg;base64,${url}" />

      category.items.forEach(item => {
        console.log(item.imageUrl, "url");

        const menuItem = document.createElement("div");
        menuItem.classList.add("menu-item");
        menuItem.innerHTML = `        
      <img src="${item.imageUrl}" alt="${item.name}" class="menu-image">
      <div class="menu-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p>₹${item.price}</p>
        <button class="add-cart" aria-label="Edit item" title="Edit item">✏️</button>     
                <button class="add-menu" id="del-cart" aria-label="Edit item" title="Edit item">🗑️</button>     
         </div>
    `;
        // Add the event listener for the button
        const editButton = menuItem.querySelector('.add-cart');

        const delCart = menuItem.querySelector('.add-menu');
        editButton.addEventListener('click', function () {
          openCartModal(category.id, item, 'edit');
        });
        delCart.addEventListener('click', function () {
          deleteMenu(category.id, item.id);
        });
        menuSection.appendChild(menuItem);
      });
    });


    const cartBtn = document.createElement('p');
    cartBtn.classList.add('cart-p');
    // cartBtn.innerHTML = `<button onclick="openCartModal()" class="view-cart-button" style="display:none;">View Cart</button>`;
    menuSection.appendChild(cartBtn);
    // IntersectionObserver options to reduce flickering
    const observerOptions = {
      root: null,
      rootMargin: `-${categoryNav.offsetHeight}px 0px 0px 0px`,
      threshold: 0.5 // Adjust this for how much of the section should be in view to trigger the observer
    };

    let debounceTimer;
    const observer = new IntersectionObserver((entries) => {
      clearTimeout(debounceTimer); // Clear any previous timer

      // Set a debounce timer to stop updates until scrolling completes
      debounceTimer = setTimeout(() => {
        entries.forEach(entry => {
          // console.log(entry);

          const categoryLink = document.querySelector(`a[href="#${entry.target.id}"]`);
          // console.log(categoryLink);

          if (entry.isIntersecting) {
            let active = document.querySelector(".active-link");
            document.querySelectorAll('.category-link').forEach(link => link.classList.remove('active-link'));

            if (categoryLink) {
              categoryLink.classList.add('active-link');

              if (document.querySelector('.active-link') !== active) {
                categoryLink.scrollIntoView({
                  behavior: "smooth",
                  inline: "center"
                });
              }
            }
          }
        });
      }, 250); // Adjust the delay (in milliseconds) as needed
    }, observerOptions);



    let scrollTimeout;

    // Listen for scroll events
    window.addEventListener('scroll', () => {
      // Clear the previous timeout if scrolling is still happening
      clearTimeout(scrollTimeout);

      // Set a new timeout to detect when scrolling has stopped
      scrollTimeout = setTimeout(() => {
        console.log('Scrolling has stopped!');
        selected = undefined
      }, 200); // 200ms delay to wait after scrolling stops (you can adjust this value)
    });

    // Observing each category header
    document.querySelectorAll("#menu-section h2").forEach(header => {
      console.log(header);

      observer.observe(header);
    });
    // Display file content in the HTML
    //  document.getElementById('file-content').innerText = data;

  }
}
function deleteMenu(categoryId, itemId) {
  const confirmDelete = confirm("Are you sure you want to delete this Menu?");
  if(confirmDelete){
    // Find the category containing the item
  const category = menuData.menu.find(c => c.id === categoryId);

  if (!category) {
    console.error("Category not found");
    return;
  }

  // Find the item to delete
  const itemIndex = category.items.findIndex(i => i.id === itemId);

  if (itemIndex === -1) {
    console.error("Item not found in category");
    return;
  }

  // Remove the item from the category
  category.items.splice(itemIndex, 1);

  console.log(`Item with ID ${itemId} removed from category ${categoryId}`);

  // Refresh the menu display
  createMenu(menuData);
  }
  
}

function generateThumbnail(input) {
  const file = input.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.src = event.target.result;

    img.onload = function () {
      // Set the desired thumbnail dimensions
      const thumbnailWidth = 100; // Example width for thumbnail
      const thumbnailHeight = 100; // Example height for thumbnail

      // Create a canvas to resize the image
      const canvas = document.createElement("canvas");
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      const ctx = canvas.getContext("2d");

      // Draw the image onto the canvas with new dimensions
      ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);

      // Convert the canvas to a Base64 string
      thumbnailBase64 = canvas.toDataURL("image/png"); // You can specify "image/jpeg" if needed
    };
  };

  // Read the file as a data URL
  reader.readAsDataURL(file);
}
// Use the `thumbnailBase64` in your `addMenu` function for the image URL
// Helper function to generate a unique ID
function generateUniqueId() {
  return crypto.randomUUID();
}

async function addMenu(event) {
  event.preventDefault();
  const category = document.getElementById('category').value.trim();
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = document.getElementById('price').value.trim();

  if (!thumbnailBase64) {
    thumbnailBase64 = '';
  }

  // Add the item to `menuData`
  const newItem = {
    id: generateUniqueId(),
    name,
    description,
    price: parseFloat(price),
    imageUrl: thumbnailBase64,  // Use Base64 thumbnail as the image URL
  };

  // Find existing category by ID, or add a new one with a unique ID
  let existingCategory = menuData.menu.find(item => item.id === category);
  console.log(existingCategory, "existing Categr", category);

  if (existingCategory) {
    existingCategory.items.push(newItem);
  } else {
    const newCategory = {
      category,
      items: [newItem]
    };
    menuData.menu.push(newCategory);
  }

  // Refresh the menu display
  createMenu(menuData);
  thumbnailBase64 ='';
  closeCartModal();
}

function navLinkClick(categoryId, e) {
  e.preventDefault();
  selected = categoryId
}
// Call loadMenu on page load
// document.addEventListener("DOMContentLoaded", loadMenu);


// Add to cart function
function addToCart(name, price) {
  const menuSection = document.getElementById("menu-section");
  const itemIndex = cart.findIndex(item => item.name === name);
  if (itemIndex === -1) {
    cart.push({ name, price, quantity: 1 });
  } else {
    cart[itemIndex].quantity += 1;
  }
  updateCart();
}

// Update cart function
function updateCart() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";  // Clear previous items
  let totalAmount = 0;

  cart.forEach((item, index) => {
    totalAmount += item.price * item.quantity;
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
      <div>
        <span>${item.name} - ₹${item.price} </span>
      </div>
      <div class="buttons-container">
        <button onclick="changeQuantity('${item.name}', 1)">+</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity('${item.name}', -1)">-</button>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });
  const totalItems = cart.length;
  document.getElementById("total-amount").innerText = `Total: ₹${totalAmount}`;
  const cartBtn = document.querySelector(".view-cart-button")

  // cartBtn.style.display = "block";
  cart
  cartBtn.innerHTML = `
    <span class="cart-info-left">${totalItems}</span>
    <span>Your Feast</span>
    <span class="cart-info-right"> ₹${totalAmount.toFixed(2)}</span>
  `;
  cartBtn.style.display = "block"
}

// Change item quantity
function changeQuantity(name, delta) {
  const itemIndex = cart.findIndex(item => item.name === name);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);  // Remove item if quantity is zero
    }
  }
  updateCart();
  if (cart.length === 0) {
    document.querySelector(".view-cart-button").style.display = "none";
    closeCartModal();
  }
}

// Open and close cart modal
function openCartModal(categoryId = '', menu = '', type) {
  // document.getElementById("cart-modal").style.display = "flex";
  const modal = document.getElementById("cart-modal");
  const categoryDropdown = document.getElementById("category");
  // Get values from the form inputs by their IDs
  const name = document.getElementById('name');
  const description = document.getElementById('description');
  const price = document.getElementById('price');
  const menuH2 = document.getElementById('menu-h2');
  const menBtn = document.getElementById('menu-btn');
  const menuForm = document.getElementById('add-menu-form');

  // Clear previous category options
  categoryDropdown.innerHTML = '';

  // Populate categories from menuData
  menuData.menu.forEach(menuCategory => {
    const option = document.createElement("option");
    option.value = menuCategory.id;
    option.textContent = menuCategory.category;
    categoryDropdown.appendChild(option);
  });
  if (type === 'edit') {
    menuH2.innerHTML = 'Update Menu'
    menBtn.innerHTML = 'Update Menu'
    categoryDropdown.value = categoryId; // Set selected category based on categoryId
    categoryDropdown.setAttribute('aria-selected', true); // Set aria-selected to true
    name.value = menu.name;
    description.value = menu.description;
    price.value = menu.price;
    menuForm.onsubmit = (event)=>updateMenu(event, menu.id, categoryId);
  } else {
    menuH2.innerHTML = 'Add Menu'
    menBtn.innerHTML = 'Add Menu'
    categoryDropdown.setAttribute('aria-selected', false); // Set aria-selected to false
    menuForm.onsubmit = (event)=>addMenu(event);
  }
  modal.style.display = "flex";
}
// Function to update the menu item
function updateMenu(event, itemId, categoryId) {
  console.log("Updating menu item...");

  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = document.getElementById('price').value.trim();
  const newCategoryId = document.getElementById('category').value; // Get the new category ID

  // Find the current category and the menu item to update
  let currentCategory = menuData.menu.find(c => c.id === categoryId);
  if (!currentCategory) {
    console.error("Original category not found");
    return;
  }

  let item = currentCategory.items.find(i => i.id === itemId);
  if (!item) {
    console.error("Item not found in original category");
    return;
  }

  // Update item properties
  item.name = name;
  item.description = description;
  item.price = parseFloat(price);
  if (thumbnailBase64) {
    item.imageUrl = thumbnailBase64; // Use updated thumbnail if available
  }

  // If category has changed, move the item to the new category
  if (categoryId !== newCategoryId) {
    const newCategory = menuData.menu.find(c => c.id === newCategoryId);
    if (!newCategory) {
      console.error("New category not found");
      return;
    }

    // Remove item from the current category
    currentCategory.items = currentCategory.items.filter(i => i.id !== itemId);

    // Add the updated item to the new category
    newCategory.items.push(item);

    console.log(`Item moved from category ${categoryId} to ${newCategoryId}`);
  }
  thumbnailBase64 = ''; // Reset thumbnail
  // Refresh the menu display after update
  createMenu(menuData);
  // Close the modal
  closeCartModal();
}


function openCategoryModal(cat = '', id = '', type) {
  // event.preventDefault();
  const modal = document.getElementById("cat-modal");
  const catUpBtn = document.getElementById("cat-up");
  const starterForm = document.getElementById("add-cat-form");
  const categoryInput = document.getElementById("categor");
  const catH2 = document.getElementById("cat-h2");
  if (type === 'edit') {
    categoryInput.value = cat;
    catUpBtn.innerHTML = 'Update Category'
    catH2.innerHTML = 'Update Category'
    starterForm.onsubmit = (event) => updateCategory(cat, id, event);
  }
  else {
    // Reset form for adding a new category
    categoryInput.value = '';
    catUpBtn.innerHTML = 'Add Category';
    catH2.innerHTML = 'Add Category';
    // Set default form submission behavior
    starterForm.onsubmit = addCategory;
  }
  modal.style.display = "flex";

}

function updateCategory(cat, id, event) {
  event.preventDefault(); // Prevent default form submission behavior

  const categoryInput = document.getElementById("categor");
  const newCategoryName = categoryInput.value.trim();
  const errorMessage = document.getElementById("err");

  if (!newCategoryName) {
    errorMessage.innerText = "Category name cannot be empty!";
    return;
  }

  // Check if the new category name already exists for another category
  const isDuplicate = menuData.menu.some(
    (item) => item.category.toLowerCase() === newCategoryName.toLowerCase() && item.id !== id
  );

  if (isDuplicate) {
    errorMessage.innerText = `Category "${newCategoryName}" already exists!`;
    return;
  }

  // Find the category by ID and update its name
  const categoryIndex = menuData.menu.findIndex((item) => item.id === id);
  if (categoryIndex !== -1) {
    menuData.menu[categoryIndex].category = newCategoryName;
    errorMessage.innerText = ""; // Clear any error messages
    console.log(`Category updated successfully:`, menuData.menu[categoryIndex]);
  } else {
    errorMessage.innerText = "Category not found!";
    console.error(`Category with ID ${id} not found!`);
  }

  // Close the modal and refresh the list
  closeCategoryModal();
  loadCategoryItems();
}

function closeCartModal() {
  document.getElementById("cart-modal").style.display = "none";
}

function closeCategoryModal() {
  const errorMessage = document.getElementById("err");
  document.getElementById("cat-modal").style.display = "none";
  errorMessage.innerText = ''
}
// Placeholder for checkout
function addCategory(event) {
  event.preventDefault();
  let newCategoryName = document.getElementById('categor').value;

  // Check if the category already exists to avoid duplicates
  const categoryExists = menuData.menu.some(category => category.category === newCategoryName);

  if (!categoryExists) {
    // Add the new category to menuData
    menuData.menu.push({ id: generateUniqueId(), category: newCategoryName.trim(), items: [] });
    console.log(menuData);
    closeCategoryModal();
    loadCategoryItems();
    uploadFile()
    console.log(`Category "${newCategoryName}" added to menuData and dropdown.`);
  } else {
    document.getElementById('err').innerHTML = `Category "${newCategoryName}" already exists.`
    console.log(`Category "${newCategoryName}" already exists.`);
  }
}


// Get the query string from the URL
const queryString = window.location.search;

// Parse the query string
const urlParams = new URLSearchParams(queryString);

// Retrieve specific query parameters
const param1 = urlParams.get('param1');
//  const param2 = urlParams.get('param2');

// Display the parameters on the page or use them as needed
if (param1) {
  console.log(param1);
  document.addEventListener("DOMContentLoaded", () => loadMenu(param1));
  //  document.write(`<p>Parameter 1: ${param1}</p>`);
}
else {
  document.addEventListener("DOMContentLoaded", () => loadMenu());
}


function showSection(section) {
  // Remove 'active' class from all tabs and tab contents
  document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Add 'active' class to the selected tab and content
  document.querySelector(`[onclick="showSection('${section}')"]`).classList.add('active');
  // document.getElementById(`${section}-section`).classList.add('active');
  if (section === 'menu') {
    document.getElementById('menu-section').style.display = 'block';
    document.getElementById('cat-item').style.display = 'none';
    document.getElementById('men-btn').style.display = 'block'
    document.getElementById('cat-btn').style.display = 'none'
    const categoryLinks = document.getElementsByClassName('category-link');
    for (let i = 0; i < categoryLinks.length; i++) {
      categoryLinks[i].style.display = 'block';
    }
    createMenu(menuData);
  } else if (section === 'category') {
    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('cat-item').style.display = 'block';
    document.getElementById('cat-btn').style.display = 'block'
    document.getElementById('men-btn').style.display = 'none'
    const categoryLinks = document.getElementsByClassName('category-link');
    for (let i = 0; i < categoryLinks.length; i++) {
      categoryLinks[i].style.display = 'none';
    }

    loadCategoryItems();
  }
}

// Initialize by showing the menu section on load
document.addEventListener("DOMContentLoaded", () => {
  showSection('menu'); // or 'cart' to display the cart initially
});

function loadCategoryItems() {
  const categoryItemsContainer = document.getElementById('cat-item');

  if (menuData.menu.length <= 0) {
    categoryItemsContainer.innerText = "No Categories";
    categoryItemsContainer.style.textAlign = "center";
  } else {
    categoryItemsContainer.innerHTML = ''; // Clear any existing content

    // Create a ul element
    const ulElement = document.createElement('ul');
    ulElement.style.listStyleType = "none"; // Optional: Remove default list styling

    // Loop through each category in menuData and create li elements
    menuData.menu.forEach((ele) => {
      const liElement = document.createElement('li');

      // Category text
      const categoryText = document.createElement('span');
      categoryText.innerText = ele.category;
      liElement.appendChild(categoryText);

      // Edit button
      const editButton = document.createElement('button');
      editButton.innerText = "✏️";
      editButton.classList.add('edit-icon');
      editButton.addEventListener('click', () => openCategoryModal(ele.category, ele.id, 'edit'));
      liElement.appendChild(editButton);

      // Delete button
      const deleteButton = document.createElement('button');
      deleteButton.innerText = "🗑️";
      deleteButton.classList.add('delete-icon');
      deleteButton.addEventListener('click', () => deleteCategory(ele.id));
      liElement.appendChild(deleteButton);

      ulElement.appendChild(liElement);
    });


    // Append the ul to the container
    categoryItemsContainer.appendChild(ulElement);
  }
}

function deleteCategory(id) {
  const confirmDelete = confirm("Are you sure you want to delete this category?");
  if (confirmDelete) {
    // Remove the category from menuData based on id
    menuData.menu = menuData.menu.filter((item) => item.id !== id);

    // Refresh the category list
    loadCategoryItems();

    console.log(`Category with ID ${id} has been deleted.`);
  }
}


// Function to handle editing a category
function editCategory(index) {
  const newCategoryName = prompt("Edit category name:", menuData.menu[index].category);

  if (newCategoryName !== null && newCategoryName.trim() !== "") {
    menuData.menu[index].category = newCategoryName; // Update category name
    loadCategoryItems(); // Refresh the list
  }
}


async function  uploadresult (){
  try {
    if(token && user.role === 'Admin'){
      const resturant_id = user.resturant_id
      const response = await fetch("https://generate-upload.ajdevelopers884.workers.dev/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({resturant_id})
      });
      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('uprl', JSON.stringify(result.url)); // Save token to localStorage
    } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("uprl");
        window.location.href = "./login.html"; // Redirect to a new page (optional)
    }
    
    }
    else{
      console.error("Fetch error:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("uprl");
      window.location.href = "./login.html"; 
    }
  } catch (error) {
    // errorMessage.textContent = "Network error. Please try again.";
    console.error("Fetch error:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("uprl");
    window.location.href = "./login.html"; 
}
 
}

async function uploadFile(){
  try {
    if(urpl && user.role === "Admin" && user.resturant_id){
      try {
        const response = await fetch(urpl, {
          method: "PUT", // Use PUT or POST based on how the signed URL is configured
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(menuData) // Convert JSON object to string
        });
    
        if (response.ok) {
          console.log("Upload successful:", await response.text());
        } else {
          console.error("Upload failed:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error uploading JSON:", error);
      }
    }
    else{
      await uploadresult()
      await uploadFile();
      
    }
  } catch (error) {
    
  }
}
// uploadFile();