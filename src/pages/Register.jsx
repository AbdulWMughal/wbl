import AddAvatar from "../images/addAvatar.png";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export const Register = () => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [image, setImage] = useState(null);
  const [avatarURL, setAvatarURL] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);

    const imageURL = URL.createObjectURL(selectedImage);
    setAvatarURL(imageURL);
  };

  const handleImageUpload = async () => {
    try {
      const storageRef = ref(storage, `userProfile/${displayName}`);
      console.log("📤 Uploading image...");
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);
      console.log("✅ Image uploaded:", url);
      return url;
    } catch (err) {
      console.error("❌ Error uploading image:", err);
      setError(true);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    console.log("🚀 Register form submitted");

    if (!displayName) {
      console.log("⚠️ No display name provided");
      setError(true);
      setLoading(false);
      return;
    }

    try {
      // Step 1: Upload image (optional)
      let photoURL = "";
      if (image) {
        photoURL = await handleImageUpload();
        if (!photoURL) {
          throw new Error("Image upload failed");
        }
      }

      // Step 2: Create user in Firebase Auth
      const res = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase user created:", res.user.uid);

      // Step 3: Update Firebase Auth profile
      await updateProfile(res.user, {
        displayName,
        photoURL,
      });
      console.log("✅ User profile updated");

      // Step 4: Add to Firestore
      const userDocRef = doc(db, "users", res.user.uid);
      await setDoc(userDocRef, {
        uid: res.user.uid,
        displayName,
        email,
        photoURL,
      });
      console.log("✅ Firestore user doc created");

      const chatDocRef = doc(db, "userChats", res.user.uid);
      await setDoc(chatDocRef, {});
      console.log("✅ Firestore userChats initialized");

      // Step 5: Navigate to home
      navigate("/");
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">HighField Park Trust</span>
        <span className="title">Register</span>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPass(e.target.value)}
          />

          <input
            style={{ display: "none" }}
            type="file"
            id="file"
            onChange={handleImageChange}
          />

          <label htmlFor="file" className="avatarLabel">
            <div className="avatarContainer">
              {avatarURL ? (
                <img src={avatarURL} alt="Selected avatar" />
              ) : (
                <img src={AddAvatar} alt="" />
              )}
            </div>
            <span>{avatarURL ? "Change avatar" : "Add an avatar"}</span>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Sign Up"}
          </button>

          {loading && <p>Uploading and compressing the image, please wait...</p>}
          {error && <h3>❌ Something went wrong!</h3>}
        </form>

        <p>
          You do have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;


// const handleSubmit = async (e) => {
//   e.preventDefault();
//   const displayName = e.target[0].value;
//   const email = e.target[1].value;
//   const password = e.target[2].value;
//   const file = e.target[3].files[0];

//   try {
//     //Create user
//     const res = await createUserWithEmailAndPassword(auth, email, password);
//     // console.log(res);

//     //Create a unique image name
//     const storageRef = ref(storage, displayName);

//     const uploadTask = uploadBytesResumable(storageRef, file);

//     // Register three observers:
//     // 1. 'state_changed' observer, called any time the state changes
//     // 2. Error observer, called on failure
//     // 3. Completion observer, called on successful completion
//     uploadTask.on(
//       (err) => {
//         // Handle unsuccessful uploads
//         setError(true);
//         console.log("---", err.message);
//       },
//       () => {
//         // Handle successful uploads on complete
//         getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
//           // Update the user
//           await updateProfile(res.user, {
//             displayName,
//             photoURL: downloadURL,
//           });
//           // console.log(downloadURL);

//           try {
//             // firestore db setup

//             await addDoc(doc(db, "users", res.user.email), {
//               uid: res.user.uid,
//               displayName,
//               email,
//               // photoURL: downloadURL,
//             });

//             //create empty user chats on firestore
//             await addDoc(doc(db, "userChat", res.user.email), {});

//             // After all successfull operation, navigate to home page
//             setTimeout(async () => {
//               navigate("/");
//             }, 4000);
//           } catch (error) {
//             setError(true);
//             console.log("***********", err.message);
//           }
//         });
//       }
//     );
//     // console.log("---------------", uploadTask);
//   } catch (err) {
//     setError(true);
//     console.log("***********", err.message);
//   }
// };
