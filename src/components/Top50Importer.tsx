import { useState } from "react";
import { importTop50 } from "../repositories/Top50Repository";

export function Top50Importer() {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      await importTop50(file);

      setMessage("TOP50のインポートが完了しました。");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? `インポートに失敗しました: ${error.message}`
          : "インポートに失敗しました。",
      );
    } finally {
      setIsImporting(false);

      // 同じファイルを再度選択できるようにする
      event.target.value = "";
    }
  };

  return (
    <div>
      <label>
        {isImporting ? "インポート中..." : "TOP50 TSVを選択"}

        <input
          type="file"
          accept=".tsv,text/tab-separated-values"
          disabled={isImporting}
          onChange={handleFileChange}
        />
      </label>

      {message && <p>{message}</p>}
    </div>
  );
}