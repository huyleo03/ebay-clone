import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SubMenu() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Các menu item cố định
  const staticMenuItems = [
    { id: "home", name: "Home", isStatic: true },
    { id: "saved", name: "Saved", isStatic: true },
    { id: "sell", name: "Sell", isStatic: true },
  ];

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:9999/categories");
        const data = await response.json();

        // Make sure each category has an id property
        const formattedData = data.map((category) => {
          // Ensure we use the correct id format - if it's coming from MongoDB, it might be in _id
          return {
            ...category,
            id:
              category.id ||
              (category._id ? category._id.toString() : category._id),
          };
        });

        // Combine static items with categories from API
        const allItems = [
          staticMenuItems[0],
          staticMenuItems[1],
          ...formattedData,
          staticMenuItems[2],
        ];

        setCategories(allItems);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
        // Fallback to static menu items in case of error
        setCategories(staticMenuItems);
      }
    };

    fetchCategories();
  }, []);

  // Handle menu item click
  const handleMenuClick = (item) => {
    if (item.isStatic) {
      // Handle static menu items (Home, Saved, Sell)
      if (item.id === "home") {
        navigate("/");
      } else {
        // You can add more navigation logic for other static items
        console.log(`Clicked on ${item.name}`);
      }
    } else {
      // Navigate to list category page for category items
      // Use the string ID directly without parsing to number
      navigate(`/list-category/${item.id}`);
    }
  };

  return (
    <>
      <div id="SubMenu" className="border-b">
        <div className="flex items-center justify-between w-full mx-auto max-w-[1200px]">
          <ul
            id="TopMenuLeft"
            className="
                            flex 
                            items-center 
                            text-[13px] 
                            text-[#333333]
                            px-2 
                            h-8
                            overflow-x-auto
                        "
          >
            {loading ? (
              <li className="px-3">Loading...</li>
            ) : (
              categories.map((item) => (
                <li
                  key={item.id}
                  className="px-3 hover:underline cursor-pointer whitespace-nowrap"
                  onClick={() => handleMenuClick(item)}
                >
                  {item.name}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
