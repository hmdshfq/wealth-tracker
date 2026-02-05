import { SignIn } from "@clerk/nextjs";
import styles from "@/app/auth/auth.module.css";

export default function SignInPage() {
  return (
    <div className={styles.authPage}>
      <SignIn />
    </div>
  );
}
