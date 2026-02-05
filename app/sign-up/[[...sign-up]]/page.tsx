import { SignUp } from "@clerk/nextjs";
import styles from "@/app/auth/auth.module.css";

export default function SignUpPage() {
  return (
    <div className={styles.authPage}>
      <SignUp />
    </div>
  );
}
