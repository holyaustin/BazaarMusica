import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { SOLANA_HOST } from '../utils/const'
import { getProgramInstance } from '../utils/utils'
const anchor = require('@project-serum/anchor')
const utf8 = anchor.utils.bytes.utf8
const { BN, web3 } = anchor
const { SystemProgram } = web3

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
}
console.log("Default Account",defaultAccounts )
const useTiktok = (
  setTikToks,
  userDetail,
  videoUrl,
  description,
  setDescription,
  setVideoUrl,
  setNewVideoShow,
) => {
  const wallet = useWallet()
  console.log('wallet is', wallet)
  const connection = new anchor.web3.Connection(SOLANA_HOST)
  console.log('connection is', connection)
  console.log('SOLANA_HOST', SOLANA_HOST)
  const program = getProgramInstance(connection, wallet)
  console.log('program is', program)
  console.log('program ID is', program.programId)
  const getTiktoks = async () => {
    console.log('fetching')

    const videos = await program.account.videoAccount.all()
    console.log(videos)

    // const res = await axios.get(
    //   'https://ipfs.io/ipfs/QmS28E89P3Gz2LZimkKSuJgXGuZEtXG6dhyzxkSbpv6mKU/tiktoks.json',
    // )
    // setTikToks(res.data);

    setTikToks(videos)
  }

  const likeVideo = async index => {

    const wallet = useWallet()
    let [video_pda] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), new BN(index).toArrayLike(Buffer, 'be', 8)],
      program.programId,
    )

    const tx = await program.rpc.likeVideo({
      accounts: {
        video: video_pda,
        authority: wallet.publicKey,
        ...defaultAccounts,
      },
    })

    console.log(tx)
  }

  const createComment = async (index, count, comment) => {
    let [video_pda] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), new BN(index).toArrayLike(Buffer, 'be', 8)],
      program.programId,
    )

    let [comment_pda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        utf8.encode('comment'),
        new BN(index).toArrayLike(Buffer, 'be', 8),
        new BN(count).toArrayLike(Buffer, 'be', 8),
      ],
      program.programId,
    )

    if (userDetail) {
      const tx = await program.rpc.createComment(
        comment,
        userDetail.userName,
        userDetail.userProfileImageUrl,
        {
          accounts: {
            video: video_pda,
            comment: comment_pda,
            authority: wallet.publicKey,
            ...defaultAccounts,
          },
        },
      )
      console.log(tx)
    }
  }

  const newVideo = async () => {
    console.log("New Video Module")
    //const wallet = useWallet()
    let [state_pda] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('state'), wallet.publicKey.toBuffer()],
      program.programId,
    )
    console.log(`state_pda is , ${state_pda.toString()}`);
    
    const stateInfo = await program.account.stateAccount.fetch(state_pda);
    console.log("stateInfo is ", stateInfo);

    let [video_pda] = await anchor.web3.PublicKey.findProgramAddress(
      [utf8.encode('video'), stateInfo.videoCount.toArrayLike(Buffer, 'be', 8)],
      program.programId,
    );

    const tx = await program.rpc.createVideo(
      description,
      console.log("description is ", description),
      videoUrl,
      console.log("videoUrl is ", videoUrl),
      userDetail.userName,
      console.log("userDetail.userName is ", userDetail.userName),
      userDetail.userProfileImageUrl,
      console.log("userDetail.userProfileImageUrl is ", userDetail.userProfileImageUrl),
      {
        accounts: {
          state: state_pda,
          video: video_pda,
          authority: wallet.publicKey,
          ...defaultAccounts,
        },
      },
      console.log("accounts is ", accounts),
    )

    console.log(tx);

    setDescription('')
    setVideoUrl('')
    setNewVideoShow(false)
  }
  const getComments = async (index, count) => {
    let commentSigners = []

    for (let i = 0; i < count; i++) {
      let [commentSigner] = await anchor.web3.PublicKey.findProgramAddress(
        [
          utf8.encode('comment'),
          new BN(index).toArrayLike(Buffer, 'be', 8),
          new BN(i).toArrayLike(Buffer, 'be', 8),
        ],
        program.programId,
      )

      commentSigners.push(commentSigner)
    }

    const comments = await program.account.commentAccount.fetchMultiple(
      commentSigners,
    )
    console.log(comments)
    return comments
  }
  return { newVideo, getTiktoks, likeVideo, createComment,  getComments }
}

export default useTiktok
