import FileUpload from "../model/file";
export async function uploadfile(req,res){
    try{
    const { userId, fileType , file } = req.body;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    }catch(e){

    }

} 

export async function getFiles(req,res) {
     try{

    }catch(e){

    }
    
}

export async function deleteFile(req,res) {
       try{

    }catch(e){

    }
    
}

