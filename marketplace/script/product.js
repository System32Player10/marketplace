document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);

    const mainBody = document.getElementById("body-main");
    const errorBody = document.getElementById("body-error");

    const showError = () => {
        if (mainBody) mainBody.style.display = "none";
        if (errorBody) errorBody.style.display = "block";
    };

    if (
        !window.location.search ||
        !params.has("productId") ||
        [...params.keys()].some(key => key !== "productId")
    ) {
        window.location.href = "../";
        return;
    }

    const productId = params.get("productId");

    if (!productId) {
        console.error("No 'productId' parameter found.");
        window.location.href = "../";
        return;
    }

    try {
        const response = await fetch("../data.json");

        if (!response.ok) {
            console.error(
                `Failed to fetch data.json. HTTP status: ${response.status}`
            );
            showError();
            return;
        }

        const data = await response.json();

        if (!data.catalogs) {
            console.error("data.json does not contain a 'catalogs' object.");
            showError();
            return;
        }

        const exists = Object.hasOwn(data.catalogs, productId);

        if (!exists) {
            console.error(`Product ID "${productId}" was not found.`);
            showError();
            return;
        }

        const product = data.catalogs[productId];

        const productName = document.getElementById("product-name");
        const productName2 = document.getElementById("product-name-small");

        if (productName) {
            productName.textContent = product.name ?? "";
        }

        if (productName2) {
            productName2.textContent = product.name ?? "";
        }

        const storeUrl = document.getElementById("store-url");

        if (
            storeUrl &&
            Array.isArray(product.brand) &&
            product.brand.length >= 2
        ) {
            storeUrl.textContent = product.brand[0] ?? "";
            storeUrl.href =
                `/marketplace/store/?id=${encodeURIComponent(product.brand[1])}`;
        }

        const productDescription =
            document.getElementById("product-description");

        if (productDescription) {
            productDescription.textContent = product.description ?? "";
        }

        const productImages =
            document.querySelectorAll(".product-images");

        const imageUrls = Array.isArray(product["product-href"])
            ? product["product-href"]
            : [];

        productImages.forEach((image, index) => {
            image.src = imageUrls[index] ?? "";
            image.alt = product.name ?? "";
        });

        const price = product.price ?? {};

        const priceSpan = document.getElementById("price-span");
        const realPriceSpan =
            document.getElementById("real-price-span");

        if (priceSpan) {
            priceSpan.textContent =
                price.discount !== undefined && price.discount !== null
                    ? `$${price.discount}`
                    : `$${price.real ?? ""}`;
        }

        if (realPriceSpan) {
            if (
                price.discount !== undefined &&
                price.discount !== null
            ) {
                realPriceSpan.textContent = `$${price.real ?? ""}`;
                realPriceSpan.style.display = "";
            } else {
                realPriceSpan.textContent = "";
                realPriceSpan.style.display = "none";
            }
        }

        const preferences = product.preferences ?? {};
        const reviews = preferences.reviews ?? [];
        const rating = preferences.rating ?? "";

        const productRating =
            document.getElementById("product-rating");

        const overallRatings =
            document.getElementById("overall-reviews");

        const overallRating = document.getElementById("overall-rating");

        if (productRating) {
            const reviewAmount = reviews[0] ?? "";
            const reviewPrefix = reviews[1] ?? "";

            productRating.textContent =
                `${rating} (${reviewAmount}${reviewPrefix} reviews)`;

            overallRating.textContent = rating;

            if (overallRatings) {
                overallRatings.textContent =
                    `${reviewAmount}${reviewPrefix} global ratings`;
            }
        }

        const overall = preferences.overall;

        if (Array.isArray(overall)) {
            overall.forEach(([star, percentage]) => {
                const percentageBar =
                    document.getElementById(`percentage-bar-${star}`);

                const percentageText =
                    document.getElementById(`percentage-${star}`);

                if (percentageBar) {
                    percentageBar.style.width = `${percentage}%`;
                }

                if (percentageText) {
                    percentageText.textContent = `${percentage}%`;
                }
            });
        }

        const variantsContainer =
            document.getElementById("variant-selector");

        const colors =
            document.getElementById("colors");

        const selectedColor =
            document.getElementById("selected-color");


        // =========================
        // COLOR VARIANTS
        // =========================

        if (colors) {
            colors.replaceChildren();

            const colorVariants =
                Array.isArray(product.variants?.color)
                    ? product.variants.color
                    : [];

            if (colorVariants.length === 0) {
                colors.parentElement.style.display = "none";
            } else {
                colors.parentElement.style.display = "";

                colorVariants.forEach((color, index) => {
                    if (!Array.isArray(color) || color.length < 2) {
                        return;
                    }

                    const button =
                        document.createElement("button");

                    button.type = "button";

                    button.className =
                        "w-10 h-10 rounded-full border-2 border-secondary shadow-sm ring-2 ring-transparent focus:ring-secondary/20 transition-all";

                    button.style.backgroundColor = color[1];
                    button.title = color[0];

                    button.addEventListener("click", () => {
                        if (selectedColor) {
                            selectedColor.textContent = color[0];
                        }

                        colors.querySelectorAll("button").forEach(item => {
                            item.classList.remove("ring-secondary");
                            item.classList.add("ring-transparent");
                        });

                        button.classList.remove("ring-transparent");
                        button.classList.add("ring-secondary");
                    });

                    colors.appendChild(button);

                    // Select first color by default
                    if (index === 0) {
                        if (selectedColor) {
                            selectedColor.textContent = color[0];
                        }

                        button.classList.remove("ring-transparent");
                        button.classList.add("ring-secondary");
                    }
                });
            }
        }


        // =========================
        // NORMAL VARIANTS
        // =========================

        if (variantsContainer) {
            variantsContainer.replaceChildren();

            const variantValues =
                Array.isArray(product.variants?.variants)
                    ? product.variants.variants
                    : [];

            if (variantValues.length === 0) {
                variantsContainer.style.display = "none";
            } else {
                variantsContainer.style.display = "";

                const label =
                    document.createElement("label");

                label.className =
                    "font-label-md text-label-md text-on-surface";

                label.textContent = "Variant";

                const select =
                    document.createElement("select");

                select.className =
                    "w-full px-sm py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all";

                variantValues.forEach((variant, index) => {
                    const option =
                        document.createElement("option");

                    option.value = variant;
                    option.textContent = variant;

                    if (index === 0) {
                        option.selected = true;
                    }

                    select.appendChild(option);
                });

                variantsContainer.appendChild(label);
                variantsContainer.appendChild(select);
            }
        }

        const availability = product.availability ?? {};

        const availabilityElement =
            document.getElementById("availability");

        if (availabilityElement) {
            const shipping =
                availability["ships-within"] ?? [];

            const shippingAmount = shipping[0] ?? "";
            const shippingPrefix = shipping[1] ?? "";

            const shippingNames = {
                h: "hours",
                d: "days",
                w: "weeks"
            };

            const shippingText =
                `${shippingAmount} ${shippingNames[shippingPrefix] ?? shippingPrefix}`;

            availabilityElement.innerHTML =
                availability["in-stock"]
                    ? `<span class="material-symbols-outlined text-[20px] text-secondary">check_circle</span><span class="font-label-md text-label-md text-on-surface font-semibold text-emerald-700">In Stock</span><span class="text-body-md font-body-md text-on-surface-variant text-sm">| Ships within ${shippingText}</span>`
                    : `<span class="material-symbols-outlined text-[20px] text-red-600">cancel</span><span class="font-label-md text-label-md text-red-600 font-semibold">Out of Stock</span><span class="text-body-md font-body-md text-on-surface-variant text-sm">| Ships within ${shippingText}</span>`;
        }

        const freeShipping =
            document.getElementById("free-shipping");

        if (freeShipping && !availability["free-shipping"]) {
            freeShipping.style.display = "none";
        }

        const warranty = availability.warranty ?? [];

        const warrantyAmount = warranty[0] ?? "";
        const warrantyPrefix = warranty[1] ?? "";

        const warrantyNames = {
            d: "Day",
            w: "Week",
            m: "Month",
            y: "Year"
        };

        const warrantyElement =
            document.getElementById("warranty");

        if (warrantyElement) {
            warrantyElement.innerHTML =
                `<span class="material-symbols-outlined text-[16px]">verified</span>${warrantyAmount}-${warrantyNames[warrantyPrefix] ?? warrantyPrefix} Warranty`;
        }

        const quantityInput =
            document.getElementById("quantity-input");

        const quantityMinus =
            document.getElementById("quantity-minus");

        const quantityPlus =
            document.getElementById("quantity-plus");

        const maxAmount = Math.max(
            1,
            Number(availability["max-amount"]) || 1
        );

        if (quantityInput) {
            quantityInput.min = "1";
            quantityInput.max = String(maxAmount);
            quantityInput.value = "1";
            quantityInput.readOnly = true;
        }

        if (quantityMinus) {
            quantityMinus.addEventListener("click", () => {
                if (!quantityInput) return;

                const current =
                    Number(quantityInput.value) || 1;

                quantityInput.value = String(
                    Math.max(1, current - 1)
                );
            });
        }

        if (quantityPlus) {
            quantityPlus.addEventListener("click", () => {
                if (!quantityInput) return;

                const current =
                    Number(quantityInput.value) || 1;

                quantityInput.value = String(
                    Math.min(maxAmount, current + 1)
                );
            });
        }

        const specification =
            document.getElementById("specification");

        if (specification) {
            specification.replaceChildren();

            const specificationRows =
                Array.isArray(product.specification)
                    ? product.specification
                    : [];

            specificationRows.forEach((item, index) => {
                if (!Array.isArray(item) || item.length < 2) {
                    return;
                }

                const row = document.createElement("tr");

                row.className =
                    `border-b border-surface-container-highest${
                        index % 2 === 0
                            ? " bg-surface-bright"
                            : ""
                    }`;

                const name =
                    document.createElement("th");

                name.className =
                    "py-sm px-md font-semibold text-on-surface w-1/3";

                name.textContent = item[0];

                const value =
                    document.createElement("td");

                value.className =
                    "py-sm px-md text-on-surface-variant";

                value.textContent = item[1];

                row.append(name, value);
                specification.appendChild(row);
            });
        }

        const globalRatings =
            document.getElementById("global-ratings");

        if (
            globalRatings &&
            Array.isArray(reviews) &&
            reviews.length >= 1
        ) {
            globalRatings.textContent =
                `${reviews[0]}${reviews[1] ?? ""} global ratings`;
        }

        const ratingNumber =
            document.getElementById("rating-number");

        if (ratingNumber) {
            ratingNumber.textContent = rating;
        }

        const starContainer =
            document.getElementById("rating-stars");

        if (
            starContainer &&
            rating !== "" &&
            !isNaN(Number(rating))
        ) {
            starContainer.replaceChildren();

            const numericRating = Number(rating);

            for (let i = 1; i <= 5; i++) {
                const star =
                    document.createElement("span");

                star.className =
                    "material-symbols-outlined text-[20px]";

                star.dataset.weight = "fill";

                if (numericRating >= i) {
                    star.textContent = "star";
                } else if (numericRating >= i - 0.5) {
                    star.textContent = "star_half";
                } else {
                    star.textContent = "star";
                    star.dataset.weight = "regular";
                }

                starContainer.appendChild(star);
            }
        }

        // =========================
        // CART SESSION
        // =========================

        const CART_STORAGE_KEY = "cartSession";

        const generateSessionId = () => {
            const characters =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

            let result = "";

            for (let i = 0; i < 16; i++) {
                result += characters[
                    Math.floor(Math.random() * characters.length)
                ];
            }

            return result;
        };


        const getCartSession = () => {
            let session = null;

            try {
                const stored =
                    sessionStorage.getItem(CART_STORAGE_KEY);

                if (stored) {
                    session = JSON.parse(stored);
                }
            } catch (error) {
                console.error(
                    "Failed to read cart session:",
                    error
                );
            }

            // Create a new session if one doesn't exist
            if (
                !session ||
                typeof session !== "object" ||
                typeof session.sessionId !== "string" ||
                session.sessionId.length !== 16 ||
                !Array.isArray(session.cart)
            ) {
                session = {
                    sessionId: generateSessionId(),
                    cart: []
                };

                sessionStorage.setItem(
                    CART_STORAGE_KEY,
                    JSON.stringify(session)
                );
            }

            return session;
        };


        const saveCartSession = (session) => {
            try {
                sessionStorage.setItem(
                    CART_STORAGE_KEY,
                    JSON.stringify(session)
                );
            } catch (error) {
                console.error(
                    "Failed to save cart session:",
                    error
                );
            }
        };


        // =========================
        // CART POPUP
        // =========================

        const addToCartButton =
            document.getElementById("add-to-cart");

        const cartPopup =
            document.getElementById("cart-popup");

        const cartPopupText =
            document.getElementById("cart-popup-text");


        const showCartPopup = (amount, productName) => {
            if (!cartPopup || !cartPopupText) {
                return;
            }

            cartPopupText.textContent =
                `${amount} ${productName} was added to cart.`;

            cartPopup.classList.remove(
                "translate-y-20",
                "opacity-0"
            );

            cartPopup.classList.add(
                "translate-y-0",
                "opacity-100"
            );

            if (window.cartPopupTimeout) {
                clearTimeout(window.cartPopupTimeout);
            }

            window.cartPopupTimeout = setTimeout(() => {
                cartPopup.classList.remove(
                    "translate-y-0",
                    "opacity-100"
                );

                cartPopup.classList.add(
                    "translate-y-20",
                    "opacity-0"
                );
            }, 2500);
        };


        // =========================
        // ADD TO CART
        // =========================

        if (addToCartButton) {
            addToCartButton.addEventListener("click", () => {

                const quantityInput =
                    document.getElementById("quantity-input");

                const amount =
                    Math.max(
                        1,
                        Number(quantityInput?.value) || 1
                    );


                // Product
                const productName =
                    product.name ?? "";


                // Price
                const price =
                    product.price ?? {};

                const actualPrice =
                    price.discount !== undefined &&
                    price.discount !== null
                        ? Number(price.discount)
                        : Number(price.real) || 0;

                const totalPrice =
                    actualPrice * amount;


                // =========================
                // SELECTED VARIANTS
                // =========================

                const selectedVariants = {};

                // Color
                const selectedColor =
                    document.getElementById("selected-color");

                const colorVariants =
                    Array.isArray(product.variants?.color)
                        ? product.variants.color
                        : [];

                if (
                    colorVariants.length > 0 &&
                    selectedColor &&
                    selectedColor.textContent
                ) {
                    selectedVariants.color =
                        selectedColor.textContent;
                }


                // Normal variant
                const variantSelect =
                    document.querySelector(
                        "#variant-selector select"
                    );

                if (variantSelect) {
                    selectedVariants.variant =
                        variantSelect.value;
                }


                // =========================
                // CART ITEM
                // =========================

                const cartItem = {
                    product: productName,
                    variants: selectedVariants,
                    amount: amount,
                    totalPrice: totalPrice
                };


                // =========================
                // GET SESSION
                // =========================

                const session =
                    getCartSession();


                // Add item to this session's cart
                session.cart.push(cartItem);


                // Save
                saveCartSession(session);


                // Popup
                showCartPopup(
                    amount,
                    productName
                );


                console.log(
                    "[CART] Session:",
                    session.sessionId
                );

                console.log(
                    "[CART] Added:",
                    cartItem
                );
            });
        }

        // =========================
        // SHOPPING CART DRAWER
        // =========================

        const shoppingCartButton =
            document.getElementById("shopping-cart-button");

        const cartDrawer =
            document.getElementById("cart-drawer");

        const cartOverlay =
            document.getElementById("cart-overlay");

        const closeCartButton =
            document.getElementById("close-cart-button");

        const cartItemsContainer =
            document.getElementById("cart-items");

        const cartItemCount =
            document.getElementById("cart-item-count");

        const cartTotal =
            document.getElementById("cart-total");


        const formatPrice = (price) => {
            return `$${Number(price).toFixed(2)}`;
        };


        const renderCart = () => {
            if (!cartItemsContainer) {
                return;
            }

            const session =
                getCartSession();

            const cart =
                session.cart;

            cartItemsContainer.replaceChildren();


            // Empty cart
            if (cart.length === 0) {
                const empty =
                    document.createElement("div");

                empty.className =
                    "flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant";

                empty.innerHTML = `
                    <span class="material-symbols-outlined text-[48px] mb-sm">
                        shopping_cart
                    </span>

                    <span class="font-headline-md text-headline-md text-on-surface">
                        Your cart is empty
                    </span>

                    <span class="text-body-md mt-xs">
                        Add something to your cart to see it here.
                    </span>
                `;

                cartItemsContainer.appendChild(empty);

                if (cartItemCount) {
                    cartItemCount.textContent = "0 items";
                }

                if (cartTotal) {
                    cartTotal.textContent = "$0.00";
                }

                return;
            }


            let itemCount = 0;
            let total = 0;


            cart.forEach((item) => {
                itemCount += Number(item.amount) || 0;
                total += Number(item.totalPrice) || 0;


                const itemElement =
                    document.createElement("div");

                itemElement.className =
                    "border border-outline-variant rounded-lg p-sm bg-surface-container-lowest";


                const productName =
                    document.createElement("div");

                productName.className =
                    "font-label-md text-label-md font-semibold text-on-surface";

                productName.textContent =
                    item.product ?? "";


                const variants =
                    document.createElement("div");

                variants.className =
                    "text-label-sm text-on-surface-variant mt-xs";

                const variantEntries =
                    Object.entries(item.variants ?? {});

                if (variantEntries.length > 0) {
                    variants.textContent =
                        variantEntries
                            .map(([key, value]) =>
                                `${key}: ${value}`
                            )
                            .join(" · ");
                }


                const bottom =
                    document.createElement("div");

                bottom.className =
                    "flex items-center justify-between mt-sm";


                const quantity =
                    document.createElement("span");

                quantity.className =
                    "text-label-sm text-on-surface-variant";

                quantity.textContent =
                    `Qty: ${item.amount}`;


                const price =
                    document.createElement("span");

                price.className =
                    "font-label-md text-label-md font-semibold text-on-surface";

                price.textContent =
                    formatPrice(item.totalPrice);


                bottom.append(
                    quantity,
                    price
                );

                itemElement.append(
                    productName,
                    variants,
                    bottom
                );

                cartItemsContainer.appendChild(
                    itemElement
                );
            });


            if (cartItemCount) {
                cartItemCount.textContent =
                    `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
            }

            if (cartTotal) {
                cartTotal.textContent =
                    formatPrice(total);
            }
        };


        const openCart = () => {
            renderCart();

            cartDrawer?.classList.remove(
                "translate-x-full"
            );

            cartOverlay?.classList.remove(
                "opacity-0",
                "pointer-events-none"
            );

            cartOverlay?.classList.add(
                "opacity-100"
            );
        };


        const closeCart = () => {
            cartDrawer?.classList.add(
                "translate-x-full"
            );

            cartOverlay?.classList.remove(
                "opacity-100"
            );

            cartOverlay?.classList.add(
                "opacity-0",
                "pointer-events-none"
            );
        };


        shoppingCartButton?.addEventListener(
            "click",
            openCart
        );

        closeCartButton?.addEventListener(
            "click",
            closeCart
        );

        cartOverlay?.addEventListener(
            "click",
            closeCart
        );

    } catch (error) {
        console.error("Error:", error);
        showError();
    }
});