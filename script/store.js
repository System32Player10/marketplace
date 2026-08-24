document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);

    const mainBody = document.getElementById("body-main");
    const errorBody = document.getElementById("body-error");

    const showError = () => {
        if (mainBody) {
            mainBody.style.display = "none";
        }

        if (errorBody) {
            errorBody.style.display = "block";
        }
    };

    /*
     * ============================================================
     * CHECK STORE ID
     * ============================================================
     */

    if (!window.location.search) {
        window.location.href = "../";
        return;
    }

    const id = params.get("id");

    if (!id) {
        console.error("No 'id' parameter found.");
        showError();
        return;
    }

    try {
        /*
         * ========================================================
         * LOAD DATA.JSON
         * ========================================================
         */

        const response = await fetch("../data.json");

        if (!response.ok) {
            console.error(
                `Failed to fetch data.json. HTTP status: ${response.status}`
            );

            showError();
            return;
        }

        const data = await response.json();

        if (!data.stores) {
            console.error(
                "data.json does not contain a 'stores' object."
            );

            showError();
            return;
        }

        if (!data.catalogs) {
            console.error(
                "data.json does not contain a 'catalogs' object."
            );

            showError();
            return;
        }

        const exists = Object.hasOwn(data.stores, id);

        if (!exists) {
            console.error(
                `Store ID "${id}" was not found.`
            );

            showError();
            return;
        }

        const store = data.stores[id];

        /*
         * ========================================================
         * STORE INFORMATION
         * ========================================================
         */

        const storeName =
            document.getElementById("store-name");

        if (storeName) {
            storeName.textContent =
                store.name ?? "";
        }


        const storeSearch =
            document.getElementById("store-search");

        if (storeSearch) {
            storeSearch.placeholder =
                `Search in ${store.name ?? "Store"}...`;
        }


        const storeLogo =
            document.getElementById("store-logo");

        if (storeLogo) {
            if (storeLogo.tagName === "IMG") {
                storeLogo.src =
                    store["logo-href"] ?? "";
            } else {
                storeLogo.href =
                    store["logo-href"] ?? "#";
            }
        }


        const storeBanner =
            document.getElementById("store-banner");

        if (
            storeBanner &&
            store["banner-href"]
        ) {
            storeBanner.style.backgroundImage =
                `url("${store["banner-href"]}")`;
        }


        const storeAbout =
            document.getElementById("store-about");

        if (storeAbout) {
            storeAbout.textContent =
                store.about ?? "";
        }


        /*
         * ========================================================
         * CONTACT
         * ========================================================
         */

        const contact =
            store.contact ?? {};


        const storeAddress =
            document.getElementById("store-address");

        if (storeAddress) {
            storeAddress.textContent =
                contact.address ?? "";
        }


        const supportMail =
            document.getElementById("support-mail");

        if (supportMail) {

            const email =
                contact["support-mail"] ?? "";

            supportMail.textContent =
                email;

            if (email) {
                supportMail.href =
                    `mailto:${email}`;
            }
        }


        const storeSite =
            document.getElementById("store-site");

        if (storeSite) {

            const website =
                contact.website ?? "";

            storeSite.textContent =
                website;

            if (website) {
                storeSite.href =
                    `https://${website}`;
            }
        }


        /*
         * ========================================================
         * STORE PREFERENCES
         * ========================================================
         */

        const joinDate =
            document.getElementById("join-date");

        if (joinDate) {
            joinDate.textContent =
                store["join-date"] ?? "";
        }


        const preferences =
            store.preferences ?? {};


        const followers =
            preferences.followers;

        const storeFollowers =
            document.getElementById("store-followers");

        if (
            storeFollowers &&
            Array.isArray(followers) &&
            followers.length >= 1
        ) {
            const number =
                followers[0];

            const suffix =
                followers[1] ?? "";

            storeFollowers.textContent =
                `${number}${suffix}`;
        }


        const positiveFeedback =
            preferences["positive-feedback"];

        const positiveFeedbackElement =
            document.getElementById("positive-feedbacks");

        if (
            positiveFeedbackElement &&
            positiveFeedback !== undefined &&
            positiveFeedback !== null
        ) {
            positiveFeedbackElement.textContent =
                `${positiveFeedback}%`;
        }


        const rating =
            preferences.rating;

        const reviews =
            preferences.reviews;

        const storeReviews =
            document.getElementById("store-reviews");

        if (
            storeReviews &&
            rating !== undefined &&
            rating !== null &&
            Array.isArray(reviews) &&
            reviews.length >= 1
        ) {
            const reviewNumber =
                reviews[0];

            const reviewSuffix =
                reviews[1] ?? "";

            storeReviews.textContent =
                `${rating}/5.0 rating (${reviewNumber}${reviewSuffix} reviews)`;
        }


        /*
         * ========================================================
         * PRODUCTS
         * ========================================================
         */

        loadProducts(
            store,
            data.catalogs
        );

    } catch (error) {

        console.error(
            "Error:",
            error
        );

        showError();
    }
});


/*
 * ================================================================
 * CART SESSION
 * ================================================================
 *
 * The entire shopping session is stored in:
 *
 * sessionStorage["cartSession"]
 *
 * Example:
 *
 * {
 *     "sessionId": "...",
 *     "cart": [],
 *     "wishlist": [
 *         "L8qX3vM5"
 *     ]
 * }
 *
 * Wishlist contains ONLY product IDs.
 *
 * Product information is always loaded from data.json.
 *
 * ================================================================
 */


/*
 * Get the current cartSession.
 */
function getCartSession() {

    const raw =
        sessionStorage.getItem("cartSession");

    /*
     * If cartSession does not exist yet,
     * create the basic structure.
     */
    if (!raw) {

        return {
            sessionId:
                crypto.randomUUID(),

            cart: [],

            wishlist: []
        };
    }


    try {

        const session =
            JSON.parse(raw);


        /*
         * Make sure cart exists.
         */
        if (!Array.isArray(session.cart)) {
            session.cart = [];
        }


        /*
         * Make sure wishlist exists.
         */
        if (!Array.isArray(session.wishlist)) {
            session.wishlist = [];
        }


        return session;

    } catch (error) {

        console.error(
            "Invalid cartSession:",
            error
        );


        return {
            sessionId:
                crypto.randomUUID(),

            cart: [],

            wishlist: []
        };
    }
}


/*
 * Save cartSession back into sessionStorage.
 */
function saveCartSession(session) {

    sessionStorage.setItem(
        "cartSession",
        JSON.stringify(session)
    );
}


/*
 * ================================================================
 * WISHLIST
 * ================================================================
 */


/*
 * Check whether a product is currently
 * inside the wishlist.
 */
function isProductWishlisted(productId) {

    const session =
        getCartSession();

    return session.wishlist.includes(
        productId
    );
}


/*
 * Add product to wishlist.
 */
function addToWishlist(productId) {

    const session =
        getCartSession();


    /*
     * Don't add duplicates.
     */
    if (
        !session.wishlist.includes(productId)
    ) {

        session.wishlist.push(
            productId
        );
    }


    saveCartSession(session);

    console.log(
        `Added "${productId}" to wishlist.`,
        session
    );
}


/*
 * Remove product from wishlist.
 */
function removeFromWishlist(productId) {

    const session =
        getCartSession();


    const index =
        session.wishlist.indexOf(
            productId
        );


    if (index !== -1) {

        session.wishlist.splice(
            index,
            1
        );
    }


    saveCartSession(session);

    console.log(
        `Removed "${productId}" from wishlist.`,
        session
    );
}


/*
 * Toggle wishlist state.
 */
function toggleWishlist(
    productId,
    productName,
    favoriteButton,
    favoriteIcon
) {

    const session =
        getCartSession();


    const index =
        session.wishlist.indexOf(
            productId
        );


    /*
     * ============================================================
     * ADD
     * ============================================================
     */

    if (index === -1) {

        session.wishlist.push(
            productId
        );


        /*
         * Change heart to filled red heart.
         */
        favoriteButton.classList.remove(
            "text-outline"
        );

        favoriteButton.classList.add(
            "text-error"
        );


        favoriteIcon.style.fontVariationSettings =
            "'FILL' 1";


        saveCartSession(session);


        showWishlistNotification(
            `${productName} added to wishlist.`
        );


        console.log(
            `Added "${productId}" to wishlist.`
        );


        return;
    }


    /*
     * ============================================================
     * REMOVE
     * ============================================================
     */

    session.wishlist.splice(
        index,
        1
    );


    /*
     * Change heart back to outline.
     */
    favoriteButton.classList.remove(
        "text-error"
    );

    favoriteButton.classList.add(
        "text-outline"
    );


    favoriteIcon.style.fontVariationSettings =
        "'FILL' 0";


    saveCartSession(session);


    showWishlistNotification(
        `${productName} removed from wishlist.`
    );


    console.log(
        `Removed "${productId}" from wishlist.`
    );
}


/*
 * ================================================================
 * WISHLIST NOTIFICATION
 * ================================================================
 */

let wishlistPopupTimeout = null;


function showWishlistNotification(message) {

    const popup =
        document.getElementById(
            "wishlist-popup"
        );

    const text =
        document.getElementById(
            "wishlist-popup-text"
        );


    /*
     * If the popup isn't in the HTML,
     * don't break the wishlist functionality.
     */
    if (!popup || !text) {

        console.warn(
            "Wishlist notification elements were not found."
        );

        return;
    }


    text.textContent =
        message;


    /*
     * Show popup.
     */
    popup.classList.remove(
        "translate-y-20",
        "opacity-0"
    );

    popup.classList.add(
        "translate-y-0",
        "opacity-100"
    );


    /*
     * Reset previous timer.
     */
    clearTimeout(
        wishlistPopupTimeout
    );


    /*
     * Hide after 2.5 seconds.
     */
    wishlistPopupTimeout =
        setTimeout(() => {

            popup.classList.remove(
                "translate-y-0",
                "opacity-100"
            );

            popup.classList.add(
                "translate-y-20",
                "opacity-0"
            );

        }, 2500);
}


/*
 * ================================================================
 * LOAD PRODUCTS
 * ================================================================
 */

function loadProducts(
    store,
    catalogs
) {

    const productGrid =
        document.getElementById(
            "product-grid"
        );


    if (!productGrid) {

        console.error(
            "Product grid element was not found."
        );

        return;
    }


    productGrid.innerHTML = "";


    const productIds =
        store["product-ids"];


    if (!Array.isArray(productIds)) {

        console.error(
            "This store does not contain a valid 'product-ids' array."
        );

        return;
    }


    for (
        const productId of productIds
    ) {

        const product =
            catalogs[productId];


        if (!product) {

            console.warn(
                `Catalog "${productId}" was referenced by the store but was not found.`
            );

            continue;
        }


        const card =
            createProductCard(
                productId,
                product
            );


        productGrid.appendChild(
            card
        );
    }


    console.log(
        `Loaded ${productGrid.children.length} products for store "${store.name}".`
    );
}


/*
 * ================================================================
 * CREATE PRODUCT CARD
 * ================================================================
 */

function createProductCard(
    productId,
    product
) {

    const card =
        document.createElement("div");


    card.className =
        "group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer";


    /*
     * ------------------------------------------------------------
     * IMAGE CONTAINER
     * ------------------------------------------------------------
     */

    const imageContainer =
        document.createElement("div");


    imageContainer.className =
        "relative h-48 w-full bg-surface-container-highest flex items-center justify-center p-4";


    /*
     * ------------------------------------------------------------
     * IMAGE
     * ------------------------------------------------------------
     */

    const image =
        document.createElement("img");


    image.alt =
        product.name ??
        "Product Image";


    image.className =
        "max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300";


    const productImages =
        product["product-href"];


    if (
        Array.isArray(productImages) &&
        productImages.length > 0
    ) {

        const imageUrl =
            productImages[0];


        if (imageUrl) {

            image.src =
                imageUrl;
        }
    }


    /*
     * ------------------------------------------------------------
     * FAVORITE BUTTON
     * ------------------------------------------------------------
     */

    const favoriteButton =
        document.createElement("button");


    favoriteButton.type =
        "button";


    favoriteButton.setAttribute(
        "aria-label",
        "Add to wishlist"
    );


    favoriteButton.className =
        "absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm transition-colors";


    /*
     * Heart icon.
     */
    favoriteButton.innerHTML = `
        <span
            class="material-symbols-outlined"
            style="font-size: 20px;">
            favorite
        </span>
    `;


    const favoriteIcon =
        favoriteButton.querySelector(
            ".material-symbols-outlined"
        );


    /*
     * ------------------------------------------------------------
     * INITIAL WISHLIST STATE
     * ------------------------------------------------------------
     *
     * This is important.
     *
     * When the page loads, check cartSession.wishlist.
     *
     * If this product ID is already there,
     * immediately display a filled red heart.
     */

    const alreadyWishlisted =
        isProductWishlisted(
            productId
        );


    if (alreadyWishlisted) {

        favoriteButton.classList.add(
            "text-error"
        );


        favoriteIcon.style.fontVariationSettings =
            "'FILL' 1";

    } else {

        favoriteButton.classList.add(
            "text-outline"
        );


        favoriteIcon.style.fontVariationSettings =
            "'FILL' 0";
    }


    /*
     * ------------------------------------------------------------
     * FAVORITE CLICK
     * ------------------------------------------------------------
     */

    favoriteButton.addEventListener(
        "click",
        (event) => {

            /*
             * Prevent the product card's click
             * event from firing.
             */
            event.stopPropagation();


            toggleWishlist(
                productId,
                product.name ?? "Product",
                favoriteButton,
                favoriteIcon
            );
        }
    );


    imageContainer.appendChild(
        image
    );

    imageContainer.appendChild(
        favoriteButton
    );


    /*
     * ------------------------------------------------------------
     * PRODUCT CONTENT
     * ------------------------------------------------------------
     */

    const content =
        document.createElement("div");


    content.className =
        "p-4 flex flex-col flex-grow";


    /*
     * Product name.
     */

    const title =
        document.createElement("h3");


    title.className =
        "font-label-md text-label-md text-on-surface mb-1 line-clamp-2";


    title.textContent =
        product.name ?? "";


    /*
     * ------------------------------------------------------------
     * RATING
     * ------------------------------------------------------------
     */

    const ratingContainer =
        document.createElement("div");


    ratingContainer.className =
        "flex items-center gap-1 mb-2";


    const star =
        document.createElement("span");


    star.className =
        "material-symbols-outlined text-yellow-400 text-sm";


    star.style.fontVariationSettings =
        "'FILL' 1";


    star.textContent =
        "star";


    const ratingText =
        document.createElement("span");


    ratingText.className =
        "font-label-sm text-label-sm text-on-surface-variant";


    const rating =
        product.preferences?.rating ??
        0;


    const reviews =
        product.preferences?.reviews;


    let reviewText =
        "";


    if (
        Array.isArray(reviews) &&
        reviews.length >= 1
    ) {

        reviewText =
            ` (${reviews[0]}${reviews[1] ?? ""})`;
    }


    ratingText.textContent =
        `${rating}${reviewText}`;


    ratingContainer.appendChild(
        star
    );

    ratingContainer.appendChild(
        ratingText
    );


    /*
     * ------------------------------------------------------------
     * BOTTOM ROW
     * ------------------------------------------------------------
     */

    const bottomRow =
        document.createElement("div");


    bottomRow.className =
        "mt-auto flex items-center justify-between";


    /*
     * Price.
     */

    const priceContainer =
        document.createElement("div");


    const price =
        product.price ?? {};


    const realPrice =
        Number(
            price.real ?? 0
        );


    const discountPrice =
        price.discount;


    if (
        discountPrice !== undefined &&
        discountPrice !== null
    ) {

        const oldPrice =
            document.createElement("span");


        oldPrice.className =
            "block text-sm text-on-surface-variant line-through";


        oldPrice.textContent =
            formatPrice(
                realPrice
            );


        const discountedPrice =
            document.createElement("span");


        discountedPrice.className =
            "font-headline-md text-headline-md text-on-surface";


        discountedPrice.textContent =
            formatPrice(
                discountPrice
            );


        priceContainer.appendChild(
            oldPrice
        );

        priceContainer.appendChild(
            discountedPrice
        );

    } else {

        const normalPrice =
            document.createElement("span");


        normalPrice.className =
            "font-headline-md text-headline-md text-on-surface";


        normalPrice.textContent =
            formatPrice(
                realPrice
            );


        priceContainer.appendChild(
            normalPrice
        );
    }


    /*
     * ------------------------------------------------------------
     * ADD TO CART
     * ------------------------------------------------------------
     */

    const cartButton =
        document.createElement("button");


    cartButton.type =
        "button";


    cartButton.className =
        "w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-secondary hover:text-white transition-colors text-on-surface";


    cartButton.innerHTML = `
        <span
            class="material-symbols-outlined"
            style="font-size: 18px;">
            add_shopping_cart
        </span>
    `;


    cartButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();


            console.log(
                `Add to cart: ${productId}`
            );
        }
    );


    bottomRow.appendChild(
        priceContainer
    );

    bottomRow.appendChild(
        cartButton
    );


    /*
     * ------------------------------------------------------------
     * ASSEMBLE CARD
     * ------------------------------------------------------------
     */

    content.appendChild(
        title
    );

    content.appendChild(
        ratingContainer
    );

    content.appendChild(
        bottomRow
    );


    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );


    /*
     * ------------------------------------------------------------
     * PRODUCT CLICK
     * ------------------------------------------------------------
     */

    card.addEventListener(
        "click",
        () => {

            console.log(
                `Product clicked: ${productId}`
            );


            window.location.href =
                `../product/?productId=${encodeURIComponent(productId)}`;
        }
    );


    return card;
}


/*
 * ================================================================
 * PRICE FORMATTER
 * ================================================================
 */

function formatPrice(price) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(price);
}