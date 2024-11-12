let menuData = []
let cart = [];  // Cart array to hold items
let selected = undefined;
function loadMenu(resturanId) {
  console.log(resturanId);
  let cleanedStr = resturanId.replace(/'/g, "");  // Removes all single quotes

  if (resturanId) {
    const cldUrl = `https://pub-fbdbb25b0f934dd8b443b70f85c547a0.r2.dev/${cleanedStr}.json`
    // Fetch the file from S3
    fetch(cldUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();  // Use response.json() if it’s a JSON file
      })
      .then(data => {
        if (data.active) {
          menuData = data.menu;
          const menuSection = document.getElementById("menu-section");
          const categoryNav = document.querySelector('.category-nav');
          categoryNav.style.overflowX = "auto"; // Ensure horizontal scrolling is enabled
          categoryNav.style.whiteSpace = "nowrap"; // Prevent wrapping, allowing the categories to be on a single line

          menuData.forEach((category, index) => {
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
              const menuItem = document.createElement("div");
              menuItem.classList.add("menu-item");
              menuItem.innerHTML = `        
            <img src="${item.imageUrl}" alt="${item.name}" class="menu-image">
            <div class="menu-content">
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <p>₹${item.price}</p>
              <button onclick="addToCart('${item.name}', ${item.price})" class="add-cart">Add to Feast</button>
            </div>
          `;
              menuSection.appendChild(menuItem);
            });
          });


          const cartBtn = document.createElement('p');
          cartBtn.classList.add('cart-p');
          cartBtn.innerHTML = `<button onclick="openCartModal()" class="view-cart-button" style="display:none;">View Cart</button>`;
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
              const categoryLink = document.querySelector(`a[href="#${entry.target.id}"]`);

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
          observer.observe(header);
        });
        // Display file content in the HTML
        //  document.getElementById('file-content').innerText = data;
          
        }
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });

  }

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
function openCartModal() {
  document.getElementById("cart-modal").style.display = "flex";
}

function closeCartModal() {
  document.getElementById("cart-modal").style.display = "none";
}

// Placeholder for checkout
function checkout() {
  alert("Checkout is not implemented yet.");
}
// Your existing JavaScript code...

// let lastScrollTop = 0; // Variable to track the last scroll position
// const categoryNav = document.querySelector('.category-nav'); // Select the navigation element

// window.addEventListener('scroll', function() {
//     let currentScroll = window.pageYOffset || document.documentElement.scrollTop; // Get the current scroll position

//     if (currentScroll > lastScrollTop) {
//         // Scrolling down, hide the navigation
//         categoryNav.style.top = '0'; // Adjust this value based on the height of your nav
//         categoryNav.style.position = 'fixed'

//     } else {
//         // Scrolling up, show the navigation
//         categoryNav.style.top = '-60px'; // Reset to its original position at the top
//         categoryNav.style.position = 'sticky'
//     }

//     lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // Update last scroll position
// });

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


