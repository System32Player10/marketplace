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
        const addToCartButton =
            document.getElementById("add-to-cart");

        if (addToCartButton) {
            addToCartButton.addEventListener("click", () => {

                const quantityInput =
                    document.getElementById("quantity-input");

                const amount =
                    Math.max(
                        1,
                        Number(quantityInput?.value) || 1
                    );


                // =========================
                // PRICE
                // =========================

                const price =
                    product.price ?? {};

                const actualPrice =
                    price.discount !== undefined &&
                    price.discount !== null
                        ? Number(price.discount)
                        : Number(price.real) || 0;


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
                // ADD TO CART
                // =========================

                if (window.Cart) {

                    const availability =
                        product.availability ?? {};

                    const maxAmount =
                        Math.max(
                            1,
                            Number(
                                availability["max-amount"]
                            ) || 1
                        );


                    window.Cart.add({

                        productId:
                            productId,

                        productName:
                            product.name ?? "",

                        price:
                            actualPrice,

                        amount:
                            amount,

                        maxAmount:
                            maxAmount,

                        variants:
                            selectedVariants
                    });

                } else {

                    console.error(
                        "[CART] Cart API is not available."
                    );
                }
            });
        }

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
            image.src = imageUrls[index - 1] ?? "";
            image.alt = product.name ?? "";
        });
        productImages[0].src = imageUrls[0];

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
    } catch (error) {
        console.error("Error:", error);
        showError();
    }
});