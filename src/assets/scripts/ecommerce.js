import {Record, Rel} from "@/assets/scripts/table.js";
import Image from "@/assets/scripts/image.js";

class User extends Record {
    constructor(familyName, givenName, middleName="") {
        super({familyName, givenName, middleName});
    }
}

class Address extends Record {
    constructor(user, region, province, city, barangay, street="") {
        super({user, region, province, city, barangay, street});
    }
}

class Product extends Record {
    constructor(name, description="", price=0, delivery=1, ...images) {
        price = parseFloat(price).toFixed(2);
        super({name, description, price, delivery});

        this.addImage(...images);
    }

    addImage(...images) {
        for(let img in images) {
            new ProductImage(this, img, "").create();
        }
    }
}

class ProductImage extends Image {
    constructor(product, path, label="") {
        super({product, path, label});
    }
}

class Order extends Record {
    constructor(user, address, ...purchases) {
        super({user, address});

        this.addPurchase(...purchases);
    }

    addPurchase(...purchases) {
        for(let pur in purchases) {
            pur.order = this;
        }
    }
}

class Purchase extends Record {
    constructor(user, product, quantity=1, order=null) {
        super({user, product, quantity, order});
    }

    get quantity() {
        return this._quantity;
    }

    set quantity(value) {
        this._quantity = Math.max(value, 1);
    }

    get price() {
        return parseFloat((this.product.price * this.quantity).toFixed(2));
    }
}

User.init();
User.relate(Address, Rel.MANY, "addresses");
User.relate(Order, Rel.MANY);
User.relate(Purchase, Rel.MANY);

Address.init();
Address.relate(User, Rel.ONE);
Address.relate(Order, Rel.MANY);

Product.init();
Product.relate(ProductImage, Rel.MANY, "images");
Product.relate(Purchase, Rel.MANY);

ProductImage.init();
ProductImage.relate(Product, Rel.ONE);

Order.init();
Order.relate(User, Rel.ONE);
Order.relate(Address, Rel.ONE);
Order.relate(Purchase, Rel.MANY);

Purchase.init(["user", "product"]);
Purchase.relate(User, Rel.ONE);
Purchase.relate(Product, Rel.ONE);
Purchase.relate(Order, Rel.ONE);

export {
    User,
    Address,
    Product,
    Order,
    Purchase
};